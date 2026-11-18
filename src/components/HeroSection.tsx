import {useRef} from 'react';
import {ArrowRight, Upload} from 'lucide-react';
import {motion, useScroll, useTransform} from 'motion/react';
import {ResilientImage} from './ResilientImage';

interface HeroSectionProps {
  onOpenStudio: () => void;
  onBrowseCatalog: () => void;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const HERO_SPECS = [
  {label: 'Cotton Density', value: '220–300 GSM'},
  {label: 'Print Resolution', value: '1200 DPI DTG'},
  {label: 'Studio Dispatch', value: '48-Hour Cure'},
  {label: 'Inventory Sync', value: 'Live SKU Ledger'},
];

export function HeroSection({onOpenStudio, onBrowseCatalog}: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const {scrollYProgress} = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const imageParallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '8%']);

  return (
    <section ref={sectionRef} className="border-b border-zinc-200 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Copy Column */}
          <div className="lg:col-span-5 flex flex-col justify-between py-2">
            <div>
              <motion.p
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.45, ease: EASE_OUT_EXPO}}
                className="text-xs font-medium tracking-wider uppercase text-zinc-500 mb-4"
              >
                Heavyweight Print Atelier · Portland &amp; Direct Dispatch
              </motion.p>

              <motion.h1
                initial={{opacity: 0, y: 16}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.55, delay: 0.06, ease: EASE_OUT_EXPO}}
                className="font-display font-bold tracking-tight text-zinc-950 leading-[1.06] mb-5"
                style={{
                  fontSize: 'clamp(2.25rem, 3.8vw, 3.5rem)',
                  textWrap: 'balance',
                }}
              >
                Custom-printed tees built on gallery-grade cotton.
              </motion.h1>

              <motion.p
                initial={{opacity: 0, y: 14}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.55, delay: 0.12, ease: EASE_OUT_EXPO}}
                className="text-base text-zinc-600 leading-relaxed max-w-md mb-8"
              >
                Upload your original artwork directly onto 280 GSM ring-spun blanks or shop our curated studio editions. Real-time stock sync, 1200 DPI water-based inks, and live print-to-door tracking.
              </motion.p>

              <motion.div
                initial={{opacity: 0, y: 12}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5, delay: 0.18, ease: EASE_OUT_EXPO}}
                className="flex flex-wrap items-center gap-3"
              >
                <motion.button
                  type="button"
                  onClick={onOpenStudio}
                  whileHover={{y: -1.5}}
                  whileTap={{scale: 0.98}}
                  transition={{duration: 0.15}}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#E63918] hover:bg-[#cf3012] text-white text-sm font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#E63918] min-h-[44px]"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload &amp; Design Tee</span>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={onBrowseCatalog}
                  whileHover={{y: -1.5}}
                  whileTap={{scale: 0.98}}
                  transition={{duration: 0.15}}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-zinc-100 text-zinc-950 border border-zinc-300 text-sm font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-950 min-h-[44px]"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </div>

            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              transition={{duration: 0.5, delay: 0.26, ease: EASE_OUT_EXPO}}
              className="pt-8 mt-8 border-t border-zinc-200 flex items-center gap-4 text-xs text-zinc-500"
            >
              <span>No minimum run</span>
              <span aria-hidden="true">·</span>
              <span>Front &amp; back printing</span>
              <span aria-hidden="true">·</span>
              <span>10% off 3+ custom tees</span>
            </motion.div>
          </div>

          {/* Right Campaign Visual with Subtle Scroll Parallax & Reveal */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{opacity: 0, scale: 1.03}}
              animate={{opacity: 1, scale: 1}}
              transition={{duration: 0.7, delay: 0.08, ease: EASE_OUT_EXPO}}
              className="relative h-full min-h-[300px] lg:min-h-[420px] rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200"
            >
              <motion.div
                style={{y: imageParallaxY}}
                className="w-full h-full scale-[1.06]"
              >
                <ResilientImage
                  src="/src/assets/images/hero_tshirt_studio_1795015673323.jpg"
                  alt="Models wearing custom heavyweight printed cotton t-shirts in chalk white and charcoal black inside a sunlit concrete studio"
                  className="w-full h-full object-cover"
                  fallbackTitle="Kroma Press Studio Campaign"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Full-Width 4-Column Studio Specification Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-10 pt-8 border-t border-zinc-200">
          {HERO_SPECS.map((spec, idx) => (
            <motion.div
              key={spec.label}
              initial={{opacity: 0, y: 12}}
              animate={{opacity: 1, y: 0}}
              transition={{
                duration: 0.45,
                delay: 0.22 + idx * 0.06,
                ease: EASE_OUT_EXPO,
              }}
            >
              <p className="text-xs text-zinc-500 mb-1">{spec.label}</p>
              <p className="font-mono tabular-nums text-base sm:text-lg font-semibold text-zinc-950">
                {spec.value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
