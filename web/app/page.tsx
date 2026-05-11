import ClassLegend from "@/components/ClassLegend";
import Gallery from "@/components/Gallery";
import Starfield from "@/components/Starfield";
import UploadZone from "@/components/UploadZone";

export default function Home() {
  return (
    <>
      <Starfield />
      <main className="relative">
        <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-white/70 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cosmos-glow animate-twinkle" />
            EfficientNet-B0 fine-tuned on Galaxy Zoo 2
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.05] mb-6">
            <span className="bg-gradient-to-r from-white via-cosmos-glow to-pink-300 bg-clip-text text-transparent">
              See morphology
            </span>
            <br />
            <span className="text-white/90">in a single glance.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/65 max-w-2xl mx-auto leading-relaxed">
            A neural network trained on 25,000 labeled galaxies sorts each image into
            one of five morphological types. Every card below is classified live by
            the model.
          </p>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-16">
          <ClassLegend />
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-semibold">
                Live gallery
              </h2>
              <p className="text-white/55 text-sm mt-1">
                Each card calls the model on page load. Ground-truth labels are
                shown so you can see when it gets it right — and when it doesn&apos;t.
              </p>
            </div>
          </div>
          <Gallery />
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-display font-semibold">
              Try your own
            </h2>
            <p className="text-white/55 text-sm mt-1">
              Drop in any galaxy image. The model returns probabilities across all
              five classes.
            </p>
          </div>
          <UploadZone />
        </section>

        <footer className="max-w-6xl mx-auto px-6 pb-12 text-center">
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
