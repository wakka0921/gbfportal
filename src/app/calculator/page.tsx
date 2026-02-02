'use client';

import React, { useState, useEffect } from 'react';

const MASTER_DATA = [
  { level: 90, contribution: 305000 },
  { level: 95, contribution: 910000 },
  { level: 100, contribution: 2680000 },
  { level: 150, contribution: 4100000 },
  { level: 200, contribution: 20000000 },
  { level: 250, contribution: 75000000 }
];

export default function EfficiencyCalculator() {
  // 状態管理
  const [highEarner, setHighEarner] = useState(false);
  const [targetContribution, setTargetContribution] = useState(0);
  const [currentTotal, setCurrentTotal] = useState(0);
  const [levelIdx, setLevelIdx] = useState(5); // 初期値 250HELL
  const [timeInput, setTimeInput] = useState("1000");
  const [compareTimeInput, setCompareTimeInput] = useState("300");

  // 計算結果用の状態
  const [results, setResults] = useState({
    remaining: 0,
    hourly: 0,
    neededRuns: 0,
    neededTimeStr: "",
    timeInterpret: "",
    compare: null as any
  });

  // 時間フォーマット関数
  const formatTime = (totalMinutes: number) => {
    if (totalMinutes <= 0) return "目標達成";
    const h = Math.floor(totalMinutes / 60);
    const m = Math.ceil(totalMinutes % 60);
    return h > 0 ? `${h}時間 ${m}分` : `${m}分`;
  };

  // 入力値を秒に変換 (例: 330 -> 210秒)
  const parseInputToSec = (val: string) => {
    if (!/^[0-9]+$/.test(val)) return null;
    let m, s;
    if (val.length <= 2) {
      m = 0; s = parseInt(val);
    } else {
      m = parseInt(val.slice(0, -2));
      s = parseInt(val.slice(-2));
    }
    if (s >= 60) return null;
    return (m * 60) + s;
  };

  // 値が変更されるたびに計算を実行
  useEffect(() => {
    const remaining = Math.max(0, targetContribution - currentTotal);
    const current = MASTER_DATA[levelIdx];
    const totalSec = parseInputToSec(timeInput);
    
    if (totalSec === null) {
      setResults(prev => ({ ...prev, timeInterpret: "入力エラー" }));
      return;
    }

    const hourly = Math.floor(3600 / totalSec) * current.contribution;
    const currentRuns = Math.ceil(remaining / current.contribution);
    const timeInterpret = `タイム: ${Math.floor(totalSec / 60)}分 ${totalSec % 60}秒`;

    let compare = null;
    if (levelIdx > 0) {
      const prev = MASTER_DATA[levelIdx - 1];
      const compSec = parseInputToSec(compareTimeInput);
      if (compSec !== null) {
        const compHourly = Math.floor(3600 / compSec) * prev.contribution;
        const ratio = current.contribution / prev.contribution;
        const limitSec = Math.floor(compSec * ratio);
        compare = {
          level: prev.level,
          hourly: compHourly,
          isCurrentBetter: hourly >= compHourly,
          limitStr: `${Math.floor(limitSec / 60)}分${limitSec % 60}秒`,
          interpret: `タイム: ${Math.floor(compSec / 60)}分 ${compSec % 60}秒`
        };
      }
    }

    setResults({
      remaining,
      hourly,
      neededRuns: currentRuns,
      neededTimeStr: formatTime((currentRuns * totalSec) / 60),
      timeInterpret,
      compare
    });
  }, [targetContribution, currentTotal, levelIdx, timeInput, compareTimeInput]);

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg border border-[#222222] shadow-sm my-10 text-[#222222]">
      <h1 className="text-xl font-bold mb-4 text-center border-b border-[#222222]/20 pb-2">古戦場貢献度効率計算機</h1>
      
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#222222]/60 uppercase">目標</label>
            <input 
              type="number" 
              value={targetContribution}
              step={highEarner ? 100000000 : 10000000}
              onChange={(e) => setTargetContribution(Number(e.target.value))}
              className="w-full mt-1 p-2 border border-[#222222] rounded bg-white font-bold text-[#222222] focus:ring-1 focus:ring-[#222222] outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#222222]/60 uppercase">現在の貢献度</label>
            <input 
              type="number" 
              value={currentTotal}
              step={highEarner ? 100000000 : 10000000}
              onChange={(e) => setCurrentTotal(Number(e.target.value))}
              className="w-full mt-1 p-2 border border-[#222222] rounded bg-white font-bold text-[#222222] focus:ring-1 focus:ring-[#222222] outline-none"
            />
          </div>
        </div>

        <div className="p-3 bg-[#222222] rounded text-center">
          <p className="text-[10px] text-gray-400 font-bold">目標まであと</p>
          <p className="text-xl font-black text-white tracking-wider">{results.remaining.toLocaleString()}</p>
        </div>

        <hr className="border-[#222222]/10" />

        {/* 難易度選択 */}
        <div className="grid grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-bold">討伐難易度</label>
            <select 
              value={levelIdx} 
              onChange={(e) => setLevelIdx(Number(e.target.value))}
              className="w-full mt-1 p-2 border border-[#222222] rounded bg-white font-bold text-gray-700"
            >
              {MASTER_DATA.map((d, i) => (
                <option key={d.level} value={i}>{d.level}HELL</option>
              ))}
            </select>
          </div>
          <div className="pb-1">
            <div className="p-2 bg-gray-50 border border-[#222222]/20 rounded text-right font-bold text-[#222222]/80">
              {MASTER_DATA[levelIdx].contribution.toLocaleString()}
            </div>
          </div>
        </div>

        {/* メインタイム入力 */}
        <div className="p-4 bg-gray-50 rounded border border-[#222222]/10">
          <label className="block text-sm font-bold mb-1 text-[#222222]">
            {MASTER_DATA[levelIdx].level}HELLのタイム
          </label>
          <input 
            type="text" 
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            className="w-full p-2 border border-[#222222] rounded text-xl text-center font-black text-[#222222]"
          />
          <div className="text-right text-[10px] text-[#222222]/60 font-bold mt-1">{results.timeInterpret}</div>
        </div>

        {/* 比較セクション */}
        {results.compare && (
          <div className="p-4 bg-white rounded border border-[#222222] border-dashed">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold">比較: {results.compare.level}HELLのタイム</label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${results.compare.isCurrentBetter ? 'bg-[#222222] text-white' : 'bg-gray-100 text-[#222222]'}`}>
                {results.compare.isCurrentBetter ? `${MASTER_DATA[levelIdx].level}HELLの方が効率的` : `${results.compare.level}HELLの方が効率的`}
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <input 
                type="text" 
                value={compareTimeInput}
                onChange={(e) => setCompareTimeInput(e.target.value)}
                className="w-2/3 p-2 border border-[#222222]/30 rounded text-lg text-center font-bold"
              />
              <div className="w-1/3 text-right">
                <p className="text-[10px] text-[#222222]/40 font-bold uppercase tracking-tighter">比較時速</p>
                <p className="font-bold text-[#222222] text-sm">{results.compare.hourly.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-[11px] text-[#222222]/70 mt-3 pt-3 border-t border-[#222222]/10 leading-relaxed">
              {results.compare.level}HELLをそのタイムで回るなら、<b>{MASTER_DATA[levelIdx].level}を {results.compare.limitStr} 以内</b>で倒せば効率的です。
            </p>
          </div>
        )}
      </div>

      {/* 結果表示 */}
      <div className="mt-6">
        <div className="p-4 bg-[#222222] rounded-lg shadow-lg text-white">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest underline underline-offset-4">選択難易度の時速</p>
            <p className="text-xl font-black">{results.hourly.toLocaleString()} <span className="text-[10px] font-bold text-gray-400">/時</span></p>
          </div>
          <div className="space-y-1 text-sm pt-2 border-t border-white/10">
            <div className="flex justify-between text-gray-300">
              <span>必要周回数:</span>
              <span className="font-bold text-white">{results.neededRuns.toLocaleString()} 回</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>所要時間:</span>
              <span className="font-bold text-white text-lg">{results.neededTimeStr}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}