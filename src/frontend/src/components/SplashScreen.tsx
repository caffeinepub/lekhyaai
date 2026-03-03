import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      // Allow fade-out animation before calling onDone
      setTimeout(() => {
        sessionStorage.setItem("splash_shown", "1");
        onDone();
      }, 600);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          data-ocid="splash.container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
          style={{
            background: "oklch(0.13 0.02 185)",
          }}
        >
          {/* Background radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.28 0.08 185 / 0.5) 0%, transparent 70%)",
            }}
          />

          {/* Main content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              ease: [0.34, 1.56, 0.64, 1],
              delay: 0.1,
            }}
            className="relative z-10 flex flex-col items-center gap-6"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.6, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative"
            >
              <img
                src="/assets/generated/lekhyaai-logo.dim_512x512.png"
                alt="LekhyaAI Logo"
                className="w-24 h-24 rounded-2xl shadow-2xl"
                onError={(e) => {
                  // Fallback to text logo if image fails
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              {/* Fallback logo */}
              <div
                className="w-24 h-24 rounded-2xl shadow-2xl items-center justify-center hidden"
                style={{
                  backgroundColor: "oklch(0.55 0.14 185)",
                  display: "none",
                }}
              >
                <span
                  className="text-white font-bold text-4xl"
                  style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
                >
                  L
                </span>
              </div>

              {/* Glowing ring */}
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  boxShadow:
                    "0 0 40px oklch(0.55 0.14 185 / 0.6), 0 0 80px oklch(0.55 0.14 185 / 0.3)",
                }}
              />
            </motion.div>

            {/* App Name */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-center"
            >
              <h1
                className="text-5xl font-bold tracking-tight mb-1"
                style={{
                  fontFamily: "Bricolage Grotesque, sans-serif",
                  color: "oklch(0.96 0.01 185)",
                  letterSpacing: "-0.02em",
                }}
              >
                LekhyaAI
              </h1>
              <p
                className="text-sm tracking-widest uppercase"
                style={{
                  color: "oklch(0.65 0.08 185)",
                  fontFamily: "General Sans, sans-serif",
                  letterSpacing: "0.2em",
                }}
              >
                AI-Powered GST Accounting
              </p>
            </motion.div>

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-center px-8"
            >
              <p
                className="text-2xl font-semibold italic"
                style={{
                  fontFamily: "Bricolage Grotesque, sans-serif",
                  color: "oklch(0.80 0.15 75)",
                }}
              >
                "Accounting ko banaye easy"
              </p>
            </motion.div>

            {/* Loading dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex gap-2 mt-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "oklch(0.55 0.14 185)" }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{
                    duration: 1.2,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Bottom section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="absolute bottom-0 left-0 right-0 flex flex-col items-center"
          >
            {/* Indian Tricolor strip */}
            <div className="w-full flex h-1.5">
              <div className="flex-1" style={{ backgroundColor: "#FF9933" }} />
              <div className="flex-1 bg-white" />
              <div className="flex-1" style={{ backgroundColor: "#138808" }} />
            </div>

            {/* Made in India text */}
            <div
              className="py-3 text-center"
              style={{
                backgroundColor: "oklch(0.10 0.02 185)",
                width: "100%",
              }}
            >
              <p
                className="text-xs"
                style={{
                  color: "oklch(0.55 0.04 185)",
                  fontFamily: "General Sans, sans-serif",
                  letterSpacing: "0.05em",
                }}
              >
                🇮🇳 Made in India &nbsp;•&nbsp; Atmanirbhar Bharat
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
