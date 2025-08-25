export function trackSearchSubmit(payload:{origin:string;destination:string}) {
  // OTEL event + бизнес-метрики
  // addEvent('search_submit', payload)
}
export function trackFirstResult(ms:number) {
  // measure time-to-first-result
}