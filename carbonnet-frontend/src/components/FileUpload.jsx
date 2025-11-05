import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, AlertCircle, CheckCircle } from "lucide-react";
import Button from "./ui/Button";
import Card from "./ui/Card";

const FileUpload = ({
  onUpload,
  acceptedFormats = {
    "text/csv": [".csv"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
    ],
    "application/vnd.ms-excel": [".xls"],
    "application/pdf": [".pdf"],
  },
  maxSize = 5242880, // 5MB
  multiple = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);

  const onDrop = useCallback(
    async (acceptedFiles, rejectedFiles) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0].code === "file-too-large") {
          setError(
            `File is too large. Maximum size is ${maxSize / 1024 / 1024}MB`
          );
        } else if (rejection.errors[0].code === "file-invalid-type") {
          setError(
            "Invalid file type. Please upload CSV, Excel, or PDF files."
          );
        } else {
          setError("File upload failed. Please try again.");
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        setUploading(true);
        try {
          await onUpload(acceptedFiles);
          setUploadedFiles(acceptedFiles);
          setError(null);
        } catch (err) {
          setError(err.message || "Upload failed. Please try again.");
        } finally {
          setUploading(false);
        }
      }
    },
    [onUpload, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats,
    maxSize,
    multiple,
  });

  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
          isDragActive
            ? "border-emerald-500 bg-emerald-50"
            : "border-gray-300 hover:border-emerald-400 hover:bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload
          className={`mx-auto mb-4 ${
            isDragActive ? "text-emerald-500" : "text-gray-400"
          }`}
          size={48}
        />
        {isDragActive ? (
          <p className="text-lg text-emerald-600 font-medium">
            Drop files here...
          </p>
        ) : (
          <>
            <p className="text-lg text-gray-700 font-medium mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: CSV, Excel, PDF (Max {maxSize / 1024 / 1024}MB)
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {uploading && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-700">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
          <span>Uploading...</span>
        </div>
      )}

      {uploadedFiles.length > 0 && !uploading && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-gray-700">Uploaded Files:</h4>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-emerald-600" />
                <FileText size={20} className="text-gray-500" />
                <div>
                  <p className="font-medium text-gray-700">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-emerald-100 rounded transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default FileUpload;
