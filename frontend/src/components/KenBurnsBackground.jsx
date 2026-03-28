import { useEffect, useState } from "react";

const generateMotion = () => {
  const zoomEnd = (Math.random() * 0.25 + 1.15).toFixed(2);
  const directions = [-10, -5, 0, 5, 10];

  return {
    "--start-scale": 1,
    "--end-scale": zoomEnd,
    "--start-x": "0%",
    "--start-y": "0%",
    "--end-x": `${directions[Math.floor(Math.random() * directions.length)]}%`,
    "--end-y": `${directions[Math.floor(Math.random() * directions.length)]}%`,
  };
};

const initialMotion = {
  "--start-scale": 1,
  "--end-scale": 1.2,
  "--start-x": "0%",
  "--start-y": "0%",
  "--end-x": "0%",
  "--end-y": "0%",
};

const KenBurnsBackground = ({
  images,
  interval = 8000,
  overlayOpacity = "bg-stone-900/60",
  imageOpacity = "opacity-75",
}) => {
  const [bgIndex, setBgIndex] = useState(0);

  const [motions, setMotions] = useState(
    images.map(() => initialMotion)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => {
        const next = (prev + 1) % images.length;

        setMotions((prevMotions) =>
          prevMotions.map((m, i) =>
            i === next ? generateMotion() : m
          )
        );

        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {images.map((img, index) => (
        <img
          key={index}
          src={img}
          alt=""
          style={motions[index]}
          className={`
            absolute inset-0 h-full w-full object-cover
            motion-safe:animate-kenburns
            transition-opacity duration-[2000ms] ease-in-out
            ${index === bgIndex ? imageOpacity : "opacity-0"}
          `}
        />
      ))}

      <div className={`absolute inset-0 ${overlayOpacity}`} />
    </div>
  );
};

export default KenBurnsBackground;
