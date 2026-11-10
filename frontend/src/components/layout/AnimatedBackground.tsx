/** Fixed, pointer-transparent ambient backdrop: two slow gradient orbs and a faint grid. GPU-friendly (transform only). */
export function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(rgb(255 255 255 / 0.035) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.035) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, #000 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, #000 30%, transparent 75%)',
        }}
      />
      <div className="orb absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-accent/[0.13] blur-[110px]" />
      <div
        className="orb absolute -right-32 top-1/3 h-[28rem] w-[28rem] rounded-full bg-[#5b6cff]/[0.10] blur-[110px]"
        style={{ animationDelay: '-9s', animationDuration: '28s' }}
      />
    </div>
  )
}
