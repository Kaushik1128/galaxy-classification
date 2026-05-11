import { CLASS_COLOR, CLASS_DESCRIPTIONS, type GalaxyClass } from "@/lib/types";

const ENTRIES: { key: GalaxyClass; name: string }[] = [
  { key: "elliptical", name: "Elliptical" },
  { key: "spiral", name: "Spiral" },
  { key: "barred_spiral", name: "Barred Spiral" },
  { key: "edge_on_disk", name: "Edge-on Disk" },
  { key: "merger", name: "Merger" },
];

export default function ClassLegend() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
      {ENTRIES.map((e) => {
        const c = CLASS_COLOR[e.key];
        return (
          <div key={e.key} className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full bg-${c}`} />
              <h4 className={`text-sm font-display text-${c}`}>{e.name}</h4>
            </div>
            <p className="text-xs text-white/55 leading-relaxed">
              {CLASS_DESCRIPTIONS[e.key]}
            </p>
          </div>
        );
      })}
    </div>
  );
}
