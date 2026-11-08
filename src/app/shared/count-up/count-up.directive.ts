import { Directive, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';

/**
 * Anima un número desde su valor anterior hasta el nuevo.
 * Uso: <span [countUp]="totalRecursos"></span>
 */
@Directive({
  selector: '[countUp]',
  standalone: true,
})
export class CountUpDirective implements OnChanges, OnDestroy {
  @Input('countUp') valor = 0;
  @Input() duracion = 1100;

  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private actual = 0;
  private raf = 0;

  ngOnChanges(cambios: SimpleChanges): void {
    if (!cambios['valor']) return;

    const destino = Number(this.valor) || 0;
    const origen = this.actual;
    const reducir = typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    cancelAnimationFrame(this.raf);

    if (reducir || origen === destino) {
      this.pintar(destino);
      return;
    }

    const inicio = performance.now();
    const paso = (ahora: number) => {
      const t = Math.min((ahora - inicio) / this.duracion, 1);
      const suave = 1 - Math.pow(1 - t, 4); // easeOutQuart
      this.pintar(origen + (destino - origen) * suave);
      if (t < 1) this.raf = requestAnimationFrame(paso);
    };
    this.raf = requestAnimationFrame(paso);
  }

  private pintar(n: number): void {
    this.actual = n;
    this.el.nativeElement.textContent = Math.round(n).toLocaleString('es-CO');
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
  }
}
