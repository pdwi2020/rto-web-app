export function PartnersStrip() {
  const items = [
    { src: "/car-front-silhouette.jpg", alt: "Car" },
    { src: "/motorbike-silhouette.jpg", alt: "Bike" },
    { src: "/truck-icon.png", alt: "Truck" },
    { src: "/bus-icon.png", alt: "Bus" },
  ]
  return (
    <section aria-label="Partners and initiatives" className="bg-card">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <ul className="flex flex-wrap items-center justify-center gap-6">
          {items.map((i, idx) => (
            <li key={idx} className="opacity-80">
              <img
                src={i.src || "/placeholder.svg"}
                alt={i.alt}
                width={120}
                height={36}
                className="h-9 w-[120px] object-contain"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
