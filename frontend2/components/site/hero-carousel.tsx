"use client"

import { useEffect, useCallback } from "react"
import Image from "next/image"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from "@/components/ui/carousel"
import { useState } from "react"

export function HeroCarousel() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  const slides = [
    {
      src: "/government-transport-services-banner.jpg",
      alt: "Government Transport Services",
      caption: "AI-Powered RTO Services - Fast, Efficient, Transparent",
    },
    {
      src: "/road-safety-and-digital-india.jpg",
      alt: "Road Safety and Digital India",
      caption: "Digital India Initiative - Modernizing Transport Services",
    },
    {
      src: "/driving-license-and-vehicle-registration.jpg",
      alt: "Driving License and Vehicle Registration",
      caption: "Complete RTO Solutions - License, Registration, E-Challan & More",
    },
    {
      src: "/digital-india.jpg",
      alt: "Digital India",
      caption: "Empowering Citizens with Technology-Driven RTO Services",
    },
  ]

  useEffect(() => {
    if (!api) return

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  // Auto-cycle through slides
  useEffect(() => {
    if (!api) return

    const intervalId = setInterval(() => {
      // When reaching the end, cycle back to start
      if (current === count - 1) {
        api.scrollTo(0)
      } else {
        api.scrollNext()
      }
    }, 4000) // Change slide every 4 seconds

    return () => clearInterval(intervalId)
  }, [api, current, count])

  return (
    <section aria-label="Highlights" className="bg-card">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6">
        <Carousel className="relative" setApi={setApi}>
          <CarouselContent className="rounded-lg border border-border">
            {slides.map((s, i) => (
              <CarouselItem key={i}>
                <figure className="relative h-[220px] w-full overflow-hidden sm:h-[300px] md:h-[400px] lg:h-[450px]">
                  <Image
                    src={s.src || "/placeholder.svg"}
                    alt={s.alt}
                    fill
                    className="object-cover scale-110"
                    sizes="(min-width: 768px) 1024px, 100vw"
                    priority={i === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 text-sm text-white font-medium">
                    {s.caption}
                  </figcaption>
                </figure>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur hover:bg-background" />
          <CarouselNext className="right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur hover:bg-background" />
        </Carousel>

        {/* Carousel indicators */}
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === current ? "w-8 bg-blue-600" : "w-2 bg-neutral-300"
              }`}
              onClick={() => api?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
