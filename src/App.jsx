import React, { useState } from "react";
import { Play, RotateCcw, Cpu, BookOpen, Info } from "lucide-react";

const TernaryCPU = () => {
  // Initialize 4x4x4 grid with random trits
  const initGrid = () =>
    Array(4)
      .fill(null)
      .map(() =>
        Array(4)
          .fill(null)
          .map(() =>
            Array(4)
              .fill(null)
              .map(() => Math.floor(Math.random() * 3))
          )
      );

  const [grid, setGrid] = useState(initGrid);
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [operation, setOperation] = useState("NOT");
  const [pos1, setPos1] = useState({ x: 0, y: 0, z: 0 });
  const [pos2, setPos2] = useState({ x: 1, y: 0, z: 0 });
  const [resultPos, setResultPos] = useState({ x: 2, y: 0, z: 0 });
  const [log, setLog] = useState([]);
  const [showExplanation, setShowExplanation] = useState(true);

  // Ternary operations
  const tritNOT = (t) => 2 - t; // 0->2, 1->1, 2->0

  const tritAND = (a, b) => Math.min(a, b);

  const tritOR = (a, b) => Math.max(a, b);

  const tritXOR = (a, b) => (a + b) % 3;

  const tritNAND = (a, b) => tritNOT(tritAND(a, b));

  const tritNOR = (a, b) => tritNOT(tritOR(a, b));

  const tritConsensus = (a, b) => {
    // Returns the majority/consensus trit
    if (a === b) return a;
    return 1; // neutral when different
  };

  const tritCycle = (t) => (t + 1) % 3; // 0->1, 1->2, 2->0

  // Multi-trit arithmetic
  const addTrits = (a, b, carryIn = 0) => {
    const sum = a + b + carryIn;
    return {
      result: sum % 3,
      carry: Math.floor(sum / 3),
    };
  };

  const subtractTrits = (a, b, borrowIn = 0) => {
    let diff = a - b - borrowIn;
    let borrow = 0;
    if (diff < 0) {
      diff += 3;
      borrow = 1;
    }
    return { result: diff, borrow };
  };

  const getTrit = (x, y, z) => grid[z][y][x];

  const setTrit = (x, y, z, value) => {
    const newGrid = grid.map((layer) => layer.map((row) => [...row]));
    newGrid[z][y][x] = value % 3;
    setGrid(newGrid);
  };

  const addLog = (msg) => {
    setLog((prev) => [...prev.slice(-5), msg]);
  };

  const executeOperation = () => {
    const val1 = getTrit(pos1.x, pos1.y, pos1.z);
    const val2 = getTrit(pos2.x, pos2.y, pos2.z);
    let result;
    let opDesc = "";

    switch (operation) {
      case "NOT":
        result = tritNOT(val1);
        opDesc = `NOT(${val1}) = ${result}`;
        setTrit(resultPos.x, resultPos.y, resultPos.z, result);
        break;

      case "AND":
        result = tritAND(val1, val2);
        opDesc = `${val1} AND ${val2} = ${result}`;
        setTrit(resultPos.x, resultPos.y, resultPos.z, result);
        break;

      case "OR":
        result = tritOR(val1, val2);
        opDesc = `${val1} OR ${val2} = ${result}`;
        setTrit(resultPos.x, resultPos.y, resultPos.z, result);
        break;

      case "XOR":
        result = tritXOR(val1, val2);
        opDesc = `${val1} XOR ${val2} = ${result}`;
        setTrit(resultPos.x, resultPos.y, resultPos.z, result);
        break;

      case "NAND":
        result = tritNAND(val1, val2);
        opDesc = `${val1} NAND ${val2} = ${result}`;
        setTrit(resultPos.x, resultPos.y, resultPos.z, result);
        break;

      case "NOR":
        result = tritNOR(val1, val2);
        opDesc = `${val1} NOR ${val2} = ${result}`;
        setTrit(resultPos.x, resultPos.y, resultPos.z, result);
        break;

      case "CONSENSUS":
        result = tritConsensus(val1, val2);
        opDesc = `CONSENSUS(${val1}, ${val2}) = ${result}`;
        setTrit(resultPos.x, resultPos.y, resultPos.z, result);
        break;

      case "CYCLE":
        result = tritCycle(val1);
        opDesc = `CYCLE(${val1}) = ${result}`;
        setTrit(resultPos.x, resultPos.y, resultPos.z, result);
        break;

      case "ADD":
        const addResult = addTrits(val1, val2);
        opDesc = `${val1} + ${val2} = ${addResult.result} (carry: ${addResult.carry})`;
        setTrit(resultPos.x, resultPos.y, resultPos.z, addResult.result);
        if (resultPos.x < 3) {
          setTrit(resultPos.x + 1, resultPos.y, resultPos.z, addResult.carry);
          opDesc += ` → [${resultPos.x + 1},${resultPos.y},${resultPos.z}]=${
            addResult.carry
          }`;
        }
        break;

      case "SUB":
        const subResult = subtractTrits(val1, val2);
        opDesc = `${val1} - ${val2} = ${subResult.result} (borrow: ${subResult.borrow})`;
        setTrit(resultPos.x, resultPos.y, resultPos.z, subResult.result);
        if (resultPos.x < 3) {
          setTrit(resultPos.x + 1, resultPos.y, resultPos.z, subResult.borrow);
          opDesc += ` → [${resultPos.x + 1},${resultPos.y},${resultPos.z}]=${
            subResult.borrow
          }`;
        }
        break;

      case "MULTI_ADD":
        let carry = 0;
        let digits = [];
        for (let i = 0; i < 4; i++) {
          const a = getTrit(i, pos1.y, pos1.z);
          const b = getTrit(i, pos2.y, pos2.z);
          const add = addTrits(a, b, carry);
          setTrit(i, resultPos.y, resultPos.z, add.result);
          carry = add.carry;
          digits.push(`[${i}]=${add.result}`);
        }
        opDesc = `Multi-trit ADD: ${digits.join(", ")} overflow=${carry}`;
        break;
    }

    addLog(`${operation}: ${opDesc}`);
  };

  const operationExplanations = {
    NOT: {
      title: "Ternary NOT (Inversion)",
      logic: "Formula: result = 2 - input",
      explanation:
        "Inverts the trit by subtracting from 2. This flips 0↔2 while keeping 1 neutral.",
      example: "NOT(0) = 2 - 0 = 2\nNOT(1) = 2 - 1 = 1\nNOT(2) = 2 - 2 = 0",
      truthTable: [
        ["Input", "Output"],
        ["0", "2"],
        ["1", "1"],
        ["2", "0"],
      ],
    },
    AND: {
      title: "Ternary AND (Minimum)",
      logic: "Formula: result = min(a, b)",
      explanation:
        "Returns the smaller trit. Like binary AND, but extended to 3 states. Only returns 2 if both inputs are 2.",
      example:
        "AND(0, 2) = min(0, 2) = 0\nAND(1, 2) = min(1, 2) = 1\nAND(2, 2) = min(2, 2) = 2",
      truthTable: [
        ["A", "B", "Output"],
        ["0", "0", "0"],
        ["0", "1", "0"],
        ["0", "2", "0"],
        ["1", "0", "0"],
        ["1", "1", "1"],
        ["1", "2", "1"],
        ["2", "0", "0"],
        ["2", "1", "1"],
        ["2", "2", "2"],
      ],
    },
    OR: {
      title: "Ternary OR (Maximum)",
      logic: "Formula: result = max(a, b)",
      explanation:
        "Returns the larger trit. Like binary OR, but extended to 3 states. Returns 0 only if both inputs are 0.",
      example:
        "OR(0, 2) = max(0, 2) = 2\nOR(1, 2) = max(1, 2) = 2\nOR(0, 0) = max(0, 0) = 0",
      truthTable: [
        ["A", "B", "Output"],
        ["0", "0", "0"],
        ["0", "1", "1"],
        ["0", "2", "2"],
        ["1", "0", "1"],
        ["1", "1", "1"],
        ["1", "2", "2"],
        ["2", "0", "2"],
        ["2", "1", "2"],
        ["2", "2", "2"],
      ],
    },
    XOR: {
      title: "Ternary XOR (Modular Sum)",
      logic: "Formula: result = (a + b) mod 3",
      explanation:
        "Adds the trits and takes remainder when divided by 3. Creates a cyclic pattern unique to ternary logic.",
      example:
        "XOR(1, 1) = (1+1) mod 3 = 2\nXOR(2, 1) = (2+1) mod 3 = 0\nXOR(2, 2) = (2+2) mod 3 = 1",
      truthTable: [
        ["A", "B", "Output"],
        ["0", "0", "0"],
        ["0", "1", "1"],
        ["0", "2", "2"],
        ["1", "0", "1"],
        ["1", "1", "2"],
        ["1", "2", "0"],
        ["2", "0", "2"],
        ["2", "1", "0"],
        ["2", "2", "1"],
      ],
    },
    NAND: {
      title: "Ternary NAND",
      logic: "Formula: result = NOT(AND(a, b)) = 2 - min(a, b)",
      explanation:
        "Performs AND operation then inverts the result. Universal gate in ternary logic.",
      example:
        "NAND(2, 2) = NOT(2) = 0\nNAND(1, 2) = NOT(1) = 1\nNAND(0, 2) = NOT(0) = 2",
    },
    NOR: {
      title: "Ternary NOR",
      logic: "Formula: result = NOT(OR(a, b)) = 2 - max(a, b)",
      explanation:
        "Performs OR operation then inverts the result. Another universal gate in ternary logic.",
      example:
        "NOR(0, 0) = NOT(0) = 2\nNOR(1, 0) = NOT(1) = 1\nNOR(2, 0) = NOT(2) = 0",
    },
    CONSENSUS: {
      title: "Ternary CONSENSUS",
      logic: "Formula: if (a == b) return a; else return 1",
      explanation:
        "Returns the agreed value if both inputs match, otherwise returns neutral state (1). Used in fault-tolerant computing.",
      example: "CONSENSUS(2, 2) = 2\nCONSENSUS(0, 0) = 0\nCONSENSUS(0, 2) = 1",
    },
    CYCLE: {
      title: "Ternary CYCLE",
      logic: "Formula: result = (input + 1) mod 3",
      explanation:
        "Rotates to the next trit value in a cycle. Used for state machines and counters.",
      example: "CYCLE(0) = 1\nCYCLE(1) = 2\nCYCLE(2) = 0",
    },
    ADD: {
      title: "Ternary Addition (Base-3)",
      logic:
        "Formula: sum = a + b + carry_in\nresult = sum mod 3\ncarry_out = floor(sum / 3)",
      explanation:
        "Adds two trits in base-3 arithmetic. When sum ≥ 3, it wraps around and generates a carry.",
      example:
        "1 + 1 = 2 (carry 0)\n2 + 1 = 0 (carry 1)\n2 + 2 = 1 (carry 1)\n2 + 2 + carry(1) = 2 (carry 1)",
      note: "Carry is stored in the next position to the right",
    },
    SUB: {
      title: "Ternary Subtraction (Base-3)",
      logic:
        "Formula: diff = a - b - borrow_in\nif (diff < 0) { diff += 3; borrow = 1 }",
      explanation:
        "Subtracts trits in base-3. When result is negative, borrows from the next position.",
      example:
        "2 - 1 = 1 (borrow 0)\n0 - 1 = 2 (borrow 1)\n1 - 2 = 2 (borrow 1)",
      note: "Borrow is stored in the next position to the right",
    },
    MULTI_ADD: {
      title: "Multi-Trit Addition",
      logic:
        "Processes entire row left-to-right, propagating carry through all 4 positions",
      explanation:
        "Performs full base-3 addition across multiple trits, like adding multi-digit numbers. Carry propagates from position to position.",
      example:
        "Row A: [2, 1, 0, 2]\nRow B: [1, 2, 2, 1]\nResult: [0, 0, 0, 0] with overflow 1",
      note: "Final carry becomes overflow if it exceeds the row",
    },
  };

  const colors = ["#1e293b", "#3b82f6", "#ef4444"];

  return (
    <div className="w-full min-h-screen bg-slate-900 text-white p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Cpu className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold">4×4×4 Ternary CPU Simulator</h1>
          </div>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            {showExplanation ? "Hide" : "Show"} Explanations
          </button>
        </div>

        {/* Explanation Panel */}
        {showExplanation && (
          <div className="mb-6 bg-gradient-to-r from-blue-900 to-purple-900 border-2 border-blue-500 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold">
                {operationExplanations[operation].title}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-yellow-400 mb-2">
                    LOGIC FORMULA:
                  </h3>
                  <code className="text-green-400 text-sm">
                    {operationExplanations[operation].logic}
                  </code>
                </div>

                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-blue-400 mb-2">
                    HOW IT WORKS:
                  </h3>
                  <p className="text-sm">
                    {operationExplanations[operation].explanation}
                  </p>
                </div>

                {operationExplanations[operation].note && (
                  <div className="bg-orange-900 border border-orange-500 rounded-lg p-3">
                    <p className="text-sm">
                      <strong>Note:</strong>{" "}
                      {operationExplanations[operation].note}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-purple-400 mb-2">
                    EXAMPLES:
                  </h3>
                  <pre className="text-sm text-green-300 whitespace-pre-line">
                    {operationExplanations[operation].example}
                  </pre>
                </div>

                {operationExplanations[operation].truthTable && (
                  <div className="bg-slate-800 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-pink-400 mb-2">
                      TRUTH TABLE:
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono">
                        <thead>
                          <tr className="border-b border-slate-600">
                            {operationExplanations[operation].truthTable[0].map(
                              (h, i) => (
                                <th key={i} className="px-2 py-1 text-blue-400">
                                  {h}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {operationExplanations[operation].truthTable
                            .slice(1)
                            .map((row, i) => (
                              <tr key={i} className="border-b border-slate-700">
                                {row.map((cell, j) => (
                                  <td key={j} className="px-2 py-1 text-center">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3D Grid Visualization */}
          <div className="lg:col-span-2 bg-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">CPU Memory Grid (4×4×4)</h2>
              <button
                onClick={() => setGrid(initGrid())}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Randomize
              </button>
            </div>

            <div className="bg-blue-900 border border-blue-500 rounded-lg p-3 mb-4 text-sm">
              <strong>💡 Understanding the 3D Structure:</strong> This is a cube
              with 64 cells (4×4×4). Each cell stores one trit (0, 1, or 2). Use
              the slider below to view different Z-layers (depth slices) of the
              cube.
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-semibold">
                Z-Layer (Depth): {selectedLayer} - Viewing layer{" "}
                {selectedLayer + 1} of 4
              </label>
              <input
                type="range"
                min="0"
                max="3"
                value={selectedLayer}
                onChange={(e) => setSelectedLayer(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {grid[selectedLayer].map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={`${x}-${y}`}
                    className="aspect-square rounded border-2 border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
                    style={{ backgroundColor: colors[cell] }}
                    onClick={() => setTrit(x, y, selectedLayer, (cell + 1) % 3)}
                  >
                    <div className="text-2xl font-bold">{cell}</div>
                    <div className="text-xs opacity-60">
                      [{x},{y},{selectedLayer}]
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: colors[0] }}
                ></div>
                <span>Trit 0 (Low)</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: colors[1] }}
                ></div>
                <span>Trit 1 (Mid)</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: colors[2] }}
                ></div>
                <span>Trit 2 (High)</span>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Operations Control</h2>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-semibold">
                Select Operation
              </label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 rounded"
              >
                <optgroup label="Unary Operations">
                  <option value="NOT">NOT (Invert)</option>
                  <option value="CYCLE">CYCLE (+1 mod 3)</option>
                </optgroup>
                <optgroup label="Binary Logic">
                  <option value="AND">AND (Min)</option>
                  <option value="OR">OR (Max)</option>
                  <option value="XOR">XOR (Sum mod 3)</option>
                  <option value="NAND">NAND</option>
                  <option value="NOR">NOR</option>
                  <option value="CONSENSUS">CONSENSUS</option>
                </optgroup>
                <optgroup label="Arithmetic">
                  <option value="ADD">ADD (Single)</option>
                  <option value="SUB">SUBTRACT (Single)</option>
                  <option value="MULTI_ADD">MULTI-TRIT ADD</option>
                </optgroup>
              </select>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block mb-1 text-sm font-semibold">
                  Operand 1 Position [X, Y, Z]
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={pos1.x}
                    onChange={(e) =>
                      setPos1({ ...pos1, x: parseInt(e.target.value) || 0 })
                    }
                    className="px-2 py-1 bg-slate-700 rounded text-sm"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={pos1.y}
                    onChange={(e) =>
                      setPos1({ ...pos1, y: parseInt(e.target.value) || 0 })
                    }
                    className="px-2 py-1 bg-slate-700 rounded text-sm"
                    placeholder="Y"
                  />
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={pos1.z}
                    onChange={(e) =>
                      setPos1({ ...pos1, z: parseInt(e.target.value) || 0 })
                    }
                    className="px-2 py-1 bg-slate-700 rounded text-sm"
                    placeholder="Z"
                  />
                </div>
                <div className="text-xs mt-1 text-green-400 font-semibold">
                  Current Value: {getTrit(pos1.x, pos1.y, pos1.z)}
                </div>
              </div>

              {!["NOT", "CYCLE"].includes(operation) && (
                <div>
                  <label className="block mb-1 text-sm font-semibold">
                    Operand 2 Position [X, Y, Z]
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      min="0"
                      max="3"
                      value={pos2.x}
                      onChange={(e) =>
                        setPos2({ ...pos2, x: parseInt(e.target.value) || 0 })
                      }
                      className="px-2 py-1 bg-slate-700 rounded text-sm"
                      placeholder="X"
                    />
                    <input
                      type="number"
                      min="0"
                      max="3"
                      value={pos2.y}
                      onChange={(e) =>
                        setPos2({ ...pos2, y: parseInt(e.target.value) || 0 })
                      }
                      className="px-2 py-1 bg-slate-700 rounded text-sm"
                      placeholder="Y"
                    />
                    <input
                      type="number"
                      min="0"
                      max="3"
                      value={pos2.z}
                      onChange={(e) =>
                        setPos2({ ...pos2, z: parseInt(e.target.value) || 0 })
                      }
                      className="px-2 py-1 bg-slate-700 rounded text-sm"
                      placeholder="Z"
                    />
                  </div>
                  <div className="text-xs mt-1 text-green-400 font-semibold">
                    Current Value: {getTrit(pos2.x, pos2.y, pos2.z)}
                  </div>
                </div>
              )}

              <div>
                <label className="block mb-1 text-sm font-semibold">
                  Result Position [X, Y, Z]
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={resultPos.x}
                    onChange={(e) =>
                      setResultPos({
                        ...resultPos,
                        x: parseInt(e.target.value) || 0,
                      })
                    }
                    className="px-2 py-1 bg-slate-700 rounded text-sm"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={resultPos.y}
                    onChange={(e) =>
                      setResultPos({
                        ...resultPos,
                        y: parseInt(e.target.value) || 0,
                      })
                    }
                    className="px-2 py-1 bg-slate-700 rounded text-sm"
                    placeholder="Y"
                  />
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={resultPos.z}
                    onChange={(e) =>
                      setResultPos({
                        ...resultPos,
                        z: parseInt(e.target.value) || 0,
                      })
                    }
                    className="px-2 py-1 bg-slate-700 rounded text-sm"
                    placeholder="Z"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={executeOperation}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center gap-2 font-semibold"
            >
              <Play className="w-5 h-5" />
              Execute Operation
            </button>

            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-2">Operation Log</h3>
              <div className="bg-slate-900 rounded p-3 text-xs font-mono space-y-1 h-48 overflow-y-auto">
                {log.length === 0 ? (
                  <div className="text-slate-500">
                    No operations executed yet. Select an operation and click
                    Execute!
                  </div>
                ) : (
                  log.map((entry, i) => (
                    <div key={i} className="text-green-400">
                      {entry}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Architecture Explanation */}
        <div className="mt-6 bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            How This CPU Processes Operations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-3xl mb-2">📍</div>
              <h3 className="font-bold text-blue-400 mb-2">Step 1: Read</h3>
              <p>
                CPU reads trit value(s) from specified 3D coordinates [X,Y,Z] in
                the memory grid.
              </p>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-3xl mb-2">⚙️</div>
              <h3 className="font-bold text-green-400 mb-2">Step 2: Process</h3>
              <p>
                Apply the selected ternary operation using the mathematical
                formula for that operation.
              </p>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-3xl mb-2">💾</div>
              <h3 className="font-bold text-purple-400 mb-2">Step 3: Write</h3>
              <p>
                Store the result back into the memory grid at the specified
                result position.
              </p>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-3xl mb-2">🔄</div>
              <h3 className="font-bold text-yellow-400 mb-2">
                Step 4: Propagate
              </h3>
              <p>
                For arithmetic operations, handle carry/borrow by storing them
                in adjacent positions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TernaryCPU;
