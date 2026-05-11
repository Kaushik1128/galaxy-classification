import ClassLegend from "@/components/ClassLegend";
import Gallery from "@/components/Gallery";
import ModelStats from "@/components/ModelStats";
import Starfield from "@/components/Starfield";
import UploadZone from "@/components/UploadZone";

export default function Home() {
  return (
    <>
      <Starfield />
      <main className="relative">
        <section className="max-w-6xl mx-auto px-5 sm:px-6 pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[11px] sm:text-xs text-white/70 mb-6 sm:mb-8 max-w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cosmos-glow animate-twinkle shrink-0" />
            <span className="truncate">EfficientNet-B0 fine-tuned on Galaxy Zoo 2</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold leading-[1.05] mb-5 sm:mb-6">
            <span className="bg-gradient-to-r from-white via-cosmos-glow to-pink-300 bg-clip-text text-transparent">
              See morphology
            </span>
            <br />
            <span className="text-white/90">in a single glance.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/65 max-w-2xl mx-auto leading-relaxed">
            A neural network trained on 25,000 labeled galaxies sorts each image into
            one of five morphological types. Every card below is classified live by
            the model.
          </p>
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-6 pb-12 sm:pb-16">
          <ClassLegend />
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-6 pb-16 sm:pb-20">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold">
              Live gallery
            </h2>
            <p className="text-white/55 text-sm mt-1">
              Each card calls the model on page load. Ground-truth labels are
              shown so you can see when it gets it right — and when it doesn&apos;t.
            </p>
          </div>
          <Gallery />
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-6 pb-16 sm:pb-20">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold">
              Under the hood
            </h2>
            <p className="text-white/55 text-sm mt-1">
              Performance on the held-out test set, the model that produced it,
              and what it gets wrong.
            </p>
          </div>
          <ModelStats />
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-6 pb-20 sm:pb-24">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold">
              Try your own
            </h2>
            <p className="text-white/55 text-sm mt-1">
              Drop in any galaxy image. The model returns probabilities across all
              five classes.
            </p>
          </div>
          <UploadZone />
        </section>

        <footer className="max-w-6xl mx-auto px-5 sm:px-6 pb-10 sm:pb-12 text-center">
          <p className="text-xs text-white/40">
            Built with PyTorch, ONNX Runtime, FastAPI, Next.js, and Three.js. Data:{" "}
            <a
              href="https://data.galaxyzoo.org/"
              className="text-cosmos-glow hover:text-white transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              Galaxy Zoo 2
            </a>
            .
          </p>
        </footer>
      </main>
    </>
  );
}
