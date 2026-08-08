"use client";

import React, { useState } from "react";
import { PatientRecord, AnalysisResult, useTCREStore } from "../store/useTCREStore";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import { Download, FileDown, Settings, SlidersHorizontal, Eye, ShieldCheck, Check, Activity } from "lucide-react";

interface ActionFooterProps {
  patient: PatientRecord | null;
  analysis: AnalysisResult | null;
}

export default function ActionFooter({ patient, analysis }: ActionFooterProps) {
  const showToast = useTCREStore((state) => state.showToast);
  const units = useTCREStore((state) => state.units);
  const targetMin = useTCREStore((state) => state.targetMin);
  const targetMax = useTCREStore((state) => state.targetMax);
  const setUnits = useTCREStore((state) => state.setUnits);
  const setTargetRange = useTCREStore((state) => state.setTargetRange);

  // Modal Open States
  const [exportOpen, setExportOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Settings Temp States
  const [tempUnits, setTempUnits] = useState<'mg/dL' | 'mmol/L'>(units);
  const [tempMin, setTempMin] = useState(targetMin.toString());
  const [tempMax, setTempMax] = useState(targetMax.toString());

  // PDF Export Status
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    showToast("Generating clinical PDF report...", "info");
    setExportOpen(false);

    try {
      const element = document.getElementById("dashboard-content");
      if (!element) {
        throw new Error("Dashboard container not found");
      }

      // Show print-only header block
      const printHeader = document.getElementById("print-report-header");
      if (printHeader) printHeader.style.display = "block";

      // Hide interactive controls during export for a clean clinical presentation
      const headerSelect = document.querySelector("header select");
      const refreshBtn = document.querySelector("header button");
      const inputSection = document.querySelector("section"); // InputControls
      const footerSection = document.getElementById("action-footer");

      if (headerSelect) (headerSelect as HTMLElement).style.opacity = "0";
      if (refreshBtn) (refreshBtn as HTMLElement).style.opacity = "0";
      if (inputSection) (inputSection as HTMLElement).style.display = "none";
      if (footerSection) (footerSection as HTMLElement).style.display = "none";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: window.getComputedStyle(document.body).backgroundColor,
      });

      // Restore style/visibility
      if (printHeader) printHeader.style.display = "none";
      if (headerSelect) (headerSelect as HTMLElement).style.opacity = "1";
      if (refreshBtn) (refreshBtn as HTMLElement).style.opacity = "1";
      if (inputSection) (inputSection as HTMLElement).style.display = "flex";
      if (footerSection) (footerSection as HTMLElement).style.display = "flex";

      const imgData = canvas.toDataURL("image/jpeg", 0.8);
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }

      const dateStr = new Date().toISOString().split("T")[0];
      const pName = patient ? patient.name.replace(/\s+/g, "_") : "patient";
      pdf.save(`TCRE_Report_${pName}_${dateStr}.pdf`);
      showToast("PDF report downloaded successfully.", "success");
    } catch (err: any) {
      console.error(err);
      showToast("PDF generation failed.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveSettings = () => {
    const minVal = parseInt(tempMin, 10);
    const maxVal = parseInt(tempMax, 10);

    if (isNaN(minVal) || isNaN(maxVal) || minVal < 40 || maxVal > 400 || minVal >= maxVal) {
      showToast("Invalid target ranges. (Min: 40-200, Max: 100-400)", "error");
      return;
    }

    setUnits(tempUnits);
    setTargetRange(minVal, maxVal);
    showToast("Preferences updated successfully.", "success");
    setSettingsOpen(false);
  };

  if (!analysis) return null;

  const { metrics } = analysis;

  return (
    <footer
      id="action-footer"
      className="w-full bg-bg-secondary border-t border-border-tertiary py-5 px-6 flex flex-col sm:flex-row items-center justify-center gap-4 shadow-inner"
    >
      {/* Export Report Trigger & Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogTrigger
          disabled={isExporting}
          className="w-full sm:w-44 h-10 text-xs font-bold flex items-center justify-center gap-2 bg-text-info hover:bg-text-info/90 text-white rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileDown className="w-4 h-4" /> {isExporting ? "Generating..." : "Export Report"}
        </DialogTrigger>
        <DialogContent className="bg-bg-primary text-text-primary border-border-secondary max-w-sm sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Download className="w-4 h-4 text-text-info" /> Export Clinical PDF Report
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Generate a high-fidelity PDF copy of the patient reasoning dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2.5">
              <label className="flex items-center gap-2.5 text-xs text-text-secondary">
                <input type="checkbox" defaultChecked disabled className="rounded text-text-info focus:ring-text-info" />
                <span>Include Glycemic Trajectory (Chart)</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-text-secondary">
                <input type="checkbox" defaultChecked disabled className="rounded text-text-info focus:ring-text-info" />
                <span>Include Glycemic Metric Indices</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-text-secondary">
                <input type="checkbox" defaultChecked disabled className="rounded text-text-info focus:ring-text-info" />
                <span>Include Latent Clinical States Summary</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-text-secondary">
                <input type="checkbox" defaultChecked disabled className="rounded text-text-info focus:ring-text-info" />
                <span>Include Composite State Synthesis</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-text-secondary">
                <input type="checkbox" defaultChecked disabled className="rounded text-text-info focus:ring-text-info" />
                <span>Include Patient Reasoning Pathway</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-text-secondary">
                <input type="checkbox" defaultChecked disabled className="rounded text-text-info focus:ring-text-info" />
                <span>Include Clinician Recommendations (TCARE)</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-text-secondary">
                <input type="checkbox" defaultChecked disabled className="rounded text-text-info focus:ring-text-info" />
                <span>Include Clinical Timeline History</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-text-secondary">
                <input type="checkbox" defaultChecked disabled className="rounded text-text-info focus:ring-text-info" />
                <span>Include Clinical Reasoning Narrative</span>
              </label>
            </div>

            <Button onClick={handleExport} className="w-full h-10 text-xs font-bold bg-text-info hover:bg-text-info/90 text-white">
              Generate and Save PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Detailed Metrics Trigger & Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogTrigger className="w-full sm:w-44 h-10 text-xs font-semibold flex items-center justify-center gap-2 border border-border-secondary rounded-md text-text-primary hover:bg-bg-secondary transition-all cursor-pointer">
          <Eye className="w-4 h-4 text-text-info" /> View Details
        </DialogTrigger>
        <DialogContent className="bg-bg-primary text-text-primary border-border-secondary max-w-2xl max-h-[85vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-text-info" /> Detailed Glycemic Metrics
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Explore formula properties, normalization curves, and telemetry history.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="vi" className="w-full mt-4">
            <TabsList className="grid grid-cols-6 h-9 bg-bg-secondary p-1 border border-border-tertiary">
              <TabsTrigger value="vi" className="text-[10px] sm:text-xs">VI</TabsTrigger>
              <TabsTrigger value="ai" className="text-[10px] sm:text-xs">AI</TabsTrigger>
              <TabsTrigger value="vol" className="text-[10px] sm:text-xs">VOL</TabsTrigger>
              <TabsTrigger value="bdi" className="text-[10px] sm:text-xs">BDI</TabsTrigger>
              <TabsTrigger value="cbi" className="text-[10px] sm:text-xs">CBI</TabsTrigger>
              <TabsTrigger value="sci" className="text-[10px] sm:text-xs">SCI</TabsTrigger>
            </TabsList>

            {/* TAB CONTENT HELPER */}
            {[
              {
                id: "vi",
                name: "Velocity Index (VI)",
                data: metrics.vi,
                formula: "VI = dG/dt (mg/dL per day)",
                text: "Velocity Index calculates the rate of change of glucose readings over the selected temporal window. High positive values denote rapid glucose climbs, indicative of postprandial spikes or insulin resistance spikes."
              },
              {
                id: "ai",
                name: "Acceleration Index (AI)",
                data: metrics.ai,
                formula: "AI = d²G/dt² (mg/dL per day²)",
                text: "Acceleration Index monitors the speed at which glucose velocity itself is changing. A positive index indicates the velocity is rising (worsening trajectory), while negative indicators reveal stabilization."
              },
              {
                id: "vol",
                name: "Volatility Index (VOL)",
                data: metrics.vol,
                formula: "VOL = σ(Glucose) over interval",
                text: "Volatility Index represents standard deviation and oscillation density of the patient's glucose telemetry. High volatility denotes extreme glycemic swings, linked with high risks of acute hypoglycemic events."
              },
              {
                id: "bdi",
                name: "Baseline Deviation Index (BDI)",
                data: metrics.bdi,
                formula: "BDI = |μ(Glucose) - Target|",
                text: "Baseline Deviation calculates the absolute average deviation of the patient's glucose values from clinical targets. Elevated index scores indicate persistent shifts from glycemic health."
              },
              {
                id: "cbi",
                name: "Cumulative Burden Index (CBI)",
                data: metrics.cbi,
                formula: "CBI = ∫ Max(0, G(t) - Threshold) dt",
                text: "Cumulative Burden calculates area-under-the-curve physiological stress. It measures the duration and severity of exposures to toxic glucose concentrations above normal thresholds."
              },
              {
                id: "sci",
                name: "State Confidence Index (SCI)",
                data: metrics.sci,
                formula: "SCI = Data Density * Signal Stability",
                text: "State Confidence is a clinical quality assurance index. It checks reading counts, gaps, outliers, and variance to gauge the reliability and accuracy of TCRE state outputs."
              }
            ].map((metric) => (
              <TabsContent key={metric.id} value={metric.id} className="space-y-4 pt-3 focus:outline-none">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 bg-bg-secondary rounded border border-border-tertiary">
                  <div>
                    <span className="text-[10px] text-text-tertiary uppercase">Raw Score</span>
                    <p className="text-base font-bold font-mono text-text-primary mt-0.5">{metric.data.raw}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-tertiary uppercase">Normalized</span>
                    <p className="text-base font-bold font-mono text-text-primary mt-0.5">{metric.data.normalized}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-tertiary uppercase">Confidence</span>
                    <p className="text-base font-bold font-mono text-text-primary mt-0.5">{metric.data.confidence}%</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-tertiary uppercase">Trend</span>
                    <p className="text-base font-bold capitalize text-text-info mt-0.5">{metric.data.trend}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-text-secondary">Clinical Interpretation</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">{metric.text}</p>
                </div>

                <div className="p-3 bg-bg-secondary/40 border border-border-tertiary rounded text-xs flex justify-between items-center">
                  <span className="text-text-tertiary">Algorithm Formula:</span>
                  <code className="text-text-info font-mono text-[11px] bg-bg-secondary px-2 py-0.5 rounded border border-border-primary">
                    {metric.formula}
                  </code>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Settings Trigger & Dialog */}
      <Dialog open={settingsOpen} onOpenChange={(open) => {
        if (open) {
          // Reset temp states to current store values on open
          setTempUnits(units);
          setTempMin(targetMin.toString());
          setTempMax(targetMax.toString());
        }
        setSettingsOpen(open);
      }}>
        <DialogTrigger className="w-full sm:w-44 h-10 text-xs font-semibold flex items-center justify-center gap-2 border border-border-secondary rounded-md text-text-primary hover:bg-bg-secondary transition-all cursor-pointer">
          <Settings className="w-4 h-4 text-text-secondary" /> Settings
        </DialogTrigger>
        <DialogContent className="bg-bg-primary text-text-primary border-border-secondary max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Settings className="w-4 h-4 text-text-secondary" /> Preferences
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Customize local units and alarm levels.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Glucose Unit</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTempUnits("mg/dL")}
                  className={`flex-1 py-1.5 rounded text-xs font-bold border transition-all ${
                    tempUnits === "mg/dL"
                      ? "bg-text-info text-white border-text-info"
                      : "bg-bg-secondary border-border-secondary text-text-secondary hover:bg-bg-secondary/80"
                  }`}
                >
                  mg/dL
                </button>
                <button
                  type="button"
                  onClick={() => setTempUnits("mmol/L")}
                  className={`flex-1 py-1.5 rounded text-xs font-bold border transition-all ${
                    tempUnits === "mmol/L"
                      ? "bg-text-info text-white border-text-info"
                      : "bg-bg-secondary border-border-secondary text-text-secondary hover:bg-bg-secondary/80"
                  }`}
                >
                  mmol/L
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Glycemic Fasting Range Targets</label>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <span className="text-[10px] text-text-tertiary">Min Limit (mg/dL)</span>
                  <input
                    type="number"
                    value={tempMin}
                    onChange={(e) => setTempMin(e.target.value)}
                    className="w-full text-xs bg-bg-secondary border border-border-secondary rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-text-info"
                  />
                </div>
                <span className="mt-4 text-text-secondary">–</span>
                <div className="flex-1">
                  <span className="text-[10px] text-text-tertiary">Max Limit (mg/dL)</span>
                  <input
                    type="number"
                    value={tempMax}
                    onChange={(e) => setTempMax(e.target.value)}
                    className="w-full text-xs bg-bg-secondary border border-border-secondary rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-text-info"
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSaveSettings} className="w-full h-10 text-xs font-bold bg-text-success hover:bg-text-success/90 text-white mt-2">
              Save Preferences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
