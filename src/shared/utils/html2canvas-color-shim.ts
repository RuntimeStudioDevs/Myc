/**
 * Utilidad de compatibilidad de color para html2canvas en entornos modernos (Tailwind CSS v4).
 *
 * html2canvas (v1.4.1) arroja un error crítico al encontrar funciones de color CSS modernas
 * como 'oklch(...)', 'oklab(...)' o 'color(...)', ya que su analizador interno solo soporta
 * 'rgb', 'rgba', 'hsl' y 'hsla'.
 *
 * Esta utilidad intercepta `getComputedStyle` (tanto en la ventana principal como en el iframe
 * clonado de html2canvas via `onclone`) y convierte de forma determinista y acelerada por hardware
 * cualquier valor OKLCH/OKLAB a su equivalente exacto sRGB (`rgb(...)` / `rgba(...)`).
 */

interface ColorConverterState {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cache: Map<string, string>;
}

let converterState: ColorConverterState | null = null;

function getColorConverter(): ColorConverterState {
  if (!converterState && typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('No se pudo inicializar el contexto 2D para la conversión de color');
    }
    converterState = {
      canvas,
      ctx,
      cache: new Map<string, string>(),
    };
  }
  return converterState!;
}

/**
 * Convierte cualquier función de color no soportada (oklch, oklab, color) a rgb/rgba estándar.
 */
export function convertColorIfUnsupported(str: string): string {
  if (!str || typeof str !== 'string') return str;
  if (!str.includes('oklch') && !str.includes('oklab') && !str.includes('color(')) {
    return str;
  }

  const { ctx, cache } = getColorConverter();
  if (cache.has(str)) {
    return cache.get(str)!;
  }

  const converted = str.replace(/(?:oklch|oklab|color)\([^)]+\)/g, (match) => {
    try {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#000000';
      ctx.fillStyle = match;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return a === 255
        ? `rgb(${r}, ${g}, ${b})`
        : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
    } catch {
      return match;
    }
  });

  cache.set(str, converted);
  return converted;
}

/**
 * Aplica el shim de getComputedStyle a una ventana objetivo (principal o iframe clonado).
 */
export function shimWindowGetComputedStyle(targetWindow: Window & typeof globalThis): () => void {
  if (!targetWindow || (targetWindow as any).__html2canvasColorShimActive) {
    return () => {};
  }

  (targetWindow as any).__html2canvasColorShimActive = true;
  const originalGetComputedStyle = targetWindow.getComputedStyle;

  targetWindow.getComputedStyle = function (
    elt: Element,
    pseudoElt?: string | null
  ): CSSStyleDeclaration {
    const style = originalGetComputedStyle.call(this, elt, pseudoElt);
    if (!style) return style;

    return new Proxy(style, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return function (propertyName: string): string {
            const rawVal = target.getPropertyValue(propertyName);
            return convertColorIfUnsupported(rawVal);
          };
        }

        // Si es una función nativa (item, setProperty, removeProperty, etc.), enlazar al target
        const origProp = (target as any)[prop];
        if (typeof origProp === 'function') {
          return origProp.bind(target);
        }

        const value = origProp;
        if (
          typeof value === 'string' &&
          (value.includes('oklch') || value.includes('oklab') || value.includes('color('))
        ) {
          return convertColorIfUnsupported(value);
        }

        return value;
      },
    });
  };

  return () => {
    targetWindow.getComputedStyle = originalGetComputedStyle;
    delete (targetWindow as any).__html2canvasColorShimActive;
  };
}
