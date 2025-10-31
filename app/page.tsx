"use client";

import { useEffect, useState } from "react";

interface RateItem {
  id: number;
  Ccy: string;
  CcyNm_UZ: string;
  Rate: string;
  Diff: string;
  Date: string;
}

export default function RatesPage() {
  const [rates, setRates] = useState<RateItem[]>([]);

  useEffect(() => {
    fetch("/api/a5IloIHx4lmwJPhgyHch0Hc043s4wZYQPqis_ST2ZQ8")
      .then((res) => res.json())
      .then((data: RateItem[]) => setRates(data))
      .catch((err) => console.error("API error:", err));
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-200 p-6">
      <h1 className="text-2xl font-semibold mb-6 text-white">
        Valyuta kurslari
      </h1>

      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
        {rates.map((item) => {
          const isUp = parseFloat(item.Diff) > 0;

          return (
            <div
              key={item.id}
              className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-4 shadow hover:shadow-lg transition-all"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-bold text-white">{item.Ccy}</span>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    isUp
                      ? "bg-green-600/20 text-green-400 border border-green-500/40"
                      : "bg-red-600/20 text-red-400 border border-red-500/40"
                  }`}
                >
                  {isUp ? `+${item.Diff}` : item.Diff}
                </span>
              </div>

              <div className="text-sm text-gray-400 mb-1">{item.CcyNm_UZ}</div>

              <div className="text-xl font-semibold text-white">
                {parseFloat(item.Rate).toLocaleString("uz-UZ")} so'm
              </div>

              <div className="text-xs text-gray-500 mt-2">
                1 {item.Ccy} ≈
              </div>

              <div className="text-xs text-gray-500">{item.Date}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
