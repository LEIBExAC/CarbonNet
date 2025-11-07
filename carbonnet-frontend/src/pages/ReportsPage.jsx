import React from "react";
import { Button, Card, Modal, Input, Select } from "../components/ui";
import { useState, useEffect } from "react";
import { useToast } from "../contexts/ToastContext";
import api from "../api/client";
import { Plus, Download, Eye } from "lucide-react";

const ReportsPage = () => {
  const { addToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await api.reports.getAll({ page: 1, limit: 50 });
      setReports(response.data.reports || response.data.items || []);
    } catch (error) {
      addToast("Failed to load reports", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (formData) => {
    setGenerating(true);
    try {
      const payload = {
        title: formData.title,
        type: formData.type,
        format: formData.format,
        period: {
          startDate: formData.startDate,
          endDate: formData.endDate,
        },
      };
      await api.reports.generate(payload);
      addToast("Report generation started", "success");
      setShowModal(false);
      setTimeout(loadReports, 2000);
    } catch (error) {
      addToast("Failed to generate report", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (id) => {
    try {
      const { blob, filename } = await api.reports.downloadFile(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "report";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast("Report downloaded", "success");
    } catch (error) {
      addToast(error.message || "Failed to download report", "error");
    }
  };

  const handleViewReport = async (report) => {
    if (report.status !== "completed") {
      addToast("Report is not ready yet", "warning");
      return;
    }
    try {
      const response = await api.reports.getById(report._id);
      setSelectedReport(response.data.report || response.data);
      setShowPreviewModal(true);
    } catch (error) {
      addToast("Failed to load report details", "error");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-2">
            Generate and download emission reports
          </p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>
          Generate Report
        </Button>
      </div>

      {/* Reports Table */}
      <Card>
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Format
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Period
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Generated
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reports.length > 0 ? (
                  reports.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">
                        {report.title}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">
                        {report.type}
                      </td>
                      <td className="px-4 py-3 text-sm uppercase">
                        {report.format}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(() => {
                          const start = report?.period?.startDate || report?.startDate;
                          const end = report?.period?.endDate || report?.endDate;
                          const startStr = start ? new Date(start).toLocaleDateString() : "-";
                          const endStr = end ? new Date(end).toLocaleDateString() : "-";
                          return `${startStr} - ${endStr}`;
                        })()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            report.status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : report.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Download"
                            onClick={() => handleDownload(report._id)}
                            disabled={report.status !== "completed"}
                          >
                            <Download size={16} />
                          </button>
                          <button
                            className="p-1 hover:bg-gray-100 rounded"
                            title="View"
                            onClick={() => handleViewReport(report)}
                            disabled={report.status !== "completed"}
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No reports generated yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Generate Report Modal */}
      <GenerateReportModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onGenerate={handleGenerate}
        loading={generating}
      />

      {/* Report Preview Modal */}
      <ReportPreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
        onDownload={() => {
          if (selectedReport) handleDownload(selectedReport._id);
        }}
      />
    </div>
  );
};

const GenerateReportModal = ({ isOpen, onClose, onGenerate, loading }) => {
  const [formData, setFormData] = useState({
    title: "",
    type: "individual",
    format: "pdf",
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const daysSelected = (() => {
    const s = new Date(formData.startDate);
    const e = new Date(formData.endDate);
    return Math.max(0, Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1);
  })();

  const pdfAllowed = formData.type === 'individual' && daysSelected <= 200;

  useEffect(() => {
    // If current selection makes PDF invalid, auto-switch to Excel
    if (formData.format === 'pdf' && !pdfAllowed) {
      setFormData((f) => ({ ...f, format: 'excel' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.type, formData.startDate, formData.endDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Report">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Report Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Monthly Carbon Report"
          required
        />

        <Select
          label="Report Type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          options={[
            { value: "individual", label: "Individual" },
            { value: "departmental", label: "Departmental" },
            { value: "institutional", label: "Institutional" },
            { value: "comparative", label: "Comparative" },
            { value: "trend", label: "Trend Analysis" },
          ]}
        />

        <Select
          label="Format"
          value={formData.format}
          onChange={(e) => setFormData({ ...formData, format: e.target.value })}
          options={[
            ...(pdfAllowed ? [{ value: 'pdf', label: 'PDF' }] : []),
            { value: 'excel', label: 'Excel' },
            { value: 'csv', label: 'CSV' },
            { value: 'json', label: 'JSON' },
          ]}
        />

        {!pdfAllowed && (
          <p className="text-xs text-amber-600 -mt-2">
            PDF is unavailable for large or institutional reports. Please use Excel/CSV.
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
            required
          />
          <Input
            label="End Date"
            type="date"
            value={formData.endDate}
            onChange={(e) =>
              setFormData({ ...formData, endDate: e.target.value })
            }
            required
          />
        </div>

        <p className="text-xs text-gray-500">Selected range: {daysSelected} days</p>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Generate Report
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const ReportPreviewModal = ({ isOpen, onClose, report, onDownload }) => {
  if (!report) return null;

  const period = report.period || {};
  const stats = report.statistics || {};
  const data = report.data || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Preview">
      <div className="space-y-4">
        {/* Report Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {new Date(period.startDate || report.startDate).toLocaleDateString()} -{" "}
            {new Date(period.endDate || report.endDate).toLocaleDateString()}
          </p>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs capitalize">
              {report.type}
            </span>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs uppercase">
              {report.format}
            </span>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-600">Total Emissions</p>
            <p className="text-lg font-bold text-gray-900">
              {(data.totalEmissions || 0).toFixed(2)} kg CO₂e
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Total Activities</p>
            <p className="text-lg font-bold text-gray-900">
              {stats.totalActivities || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Average Daily</p>
            <p className="text-lg font-bold text-gray-900">
              {(stats.averageDailyEmissions || 0).toFixed(2)} kg
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">File Size</p>
            <p className="text-lg font-bold text-gray-900">
              {report.fileSize ? `${(report.fileSize / 1024).toFixed(1)} KB` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        {data.emissionsByCategory && Object.keys(data.emissionsByCategory).length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Emissions by Category</h4>
            <div className="space-y-2">
              {Object.entries(data.emissionsByCategory).map(([category, value]) => (
                <div key={category} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-gray-700">{category}</span>
                  <span className="font-medium text-gray-900">{value.toFixed(2)} kg</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
          <Button
            type="button"
            icon={Download}
            onClick={onDownload}
            className="flex-1"
          >
            Download
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReportsPage;
