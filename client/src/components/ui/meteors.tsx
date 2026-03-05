"use client";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useState } from "react";

export const Meteors = ({
  number,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const meteorCount = number || 20;

  const [meteorStyles] = useState(() =>
    Array.from({ length: meteorCount }, (_, idx) => ({
      position: idx * (300 / meteorCount) - 50,
      animationDelay: Math.random() * (0.8 - 0.2) + 0.2 + "s",
      animationDuration: Math.floor(Math.random() * (10 - 2) + 2) + "s",
    }))
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {meteorStyles.map((style, idx) => (
        <span
          key={"meteor" + idx}
          className={cn(
            "animate-meteor-effect absolute top-0 left-1/2 h-0.5 w-0.5 rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10]",
            "before:absolute before:top-1/2 before:h-px before:w-12.5 before:-translate-y-[50%] before:transform before:bg-linear-to-r before:from-[#64748b] before:to-transparent before:content-['']",
            className,
          )}
          style={{
            top: "-5px",
            left: style.position + "px",
            animationDelay: style.animationDelay,
            animationDuration: style.animationDuration,
          }}
        ></span>
      ))}
    </motion.div>
  );
};
