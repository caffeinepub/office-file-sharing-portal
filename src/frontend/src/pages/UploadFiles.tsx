import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  File,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, FileType } from "../backend";
import { useSubmitFile } from "../hooks/useQueries";

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"];
const MAX_SIZE_BYTES = 50 * 1024 * 1024;

function getFileExt(filename: string) {
  return `.${(filename.split(".").pop() ?? "").toLowerCase()}`;
}

export default function UploadFiles() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploaded, setIsUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitFile = useSubmitFile();

  const handleFileSelect = useCallback((file: File) => {
    const ext = getFileExt(file.name);
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast.error(
        "Only images (JPG, PNG, GIF, WEBP) and PDF files are accepted.",
      );
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("File must be smaller than 50MB.");
      return;
    }
    setSelectedFile(file);
    setIsUploaded(false);
    setUploadProgress(0);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });
      const fileType = selectedFile.type.includes("pdf")
        ? FileType.pdf
        : FileType.image;
      await submitFile.mutateAsync([
        blob,
        selectedFile.name,
        fileType,
        message,
      ]);
      setIsUploaded(true);
      setSelectedFile(null);
      setMessage("");
      setUploadProgress(0);
      toast.success("File sent to admin successfully!");
    } catch (_err) {
      toast.error("Upload failed. Please try again.");
    }
  };

  const isImage = selectedFile && !selectedFile.type.includes("pdf");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload Files</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Send images or PDF documents to the admin
        </p>
      </div>

      <Card className="bg-card card-shadow border-border">
        <CardHeader className="pb-0 px-6 pt-6">
          <CardTitle className="text-base font-semibold">Select File</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleInputChange}
          />

          {/* Drop Zone */}
          <div
            data-ocid="upload.dropzone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-10 text-center transition-all duration-200 ${
              isDragging
                ? "border-primary bg-accent"
                : selectedFile
                  ? "border-primary/40 bg-primary/5"
                  : "border-border"
            }`}
          >
            {selectedFile ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  {isImage ? (
                    <ImageIcon size={24} className="text-primary" />
                  ) : (
                    <File size={24} className="text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  data-ocid="upload.close_button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                >
                  <X size={13} /> Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                  <Upload size={26} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    Drop your file here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click the button below to select
                  </p>
                </div>
                <Button
                  type="button"
                  data-ocid="upload.upload_button"
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white mt-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <File size={14} className="mr-2" />
                  Select Files
                </Button>
                <p className="text-xs text-muted-foreground">
                  Supports: JPG, PNG, GIF, WEBP, PDF (max 50MB)
                </p>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {submitFile.isPending && uploadProgress > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              data-ocid="upload.loading_state"
              className="space-y-2"
            >
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </motion.div>
          )}

          {/* Success State */}
          {isUploaded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              data-ocid="upload.success_state"
              className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200"
            >
              <CheckCircle2 size={18} className="text-emerald-600" />
              <p className="text-sm text-emerald-700 font-medium">
                File sent to admin successfully!
              </p>
            </motion.div>
          )}

          {/* Message */}
          <div>
            <Label
              htmlFor="message"
              className="text-sm font-medium text-foreground"
            >
              Message{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="message"
              data-ocid="upload.textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a note or description for the admin..."
              className="mt-1.5 resize-none h-24"
              disabled={submitFile.isPending}
            />
          </div>

          {/* Submit */}
          <Button
            type="button"
            data-ocid="upload.submit_button"
            onClick={handleSubmit}
            disabled={!selectedFile || submitFile.isPending}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold gap-2"
          >
            {submitFile.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Upload size={16} />
                Send to Admin
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
