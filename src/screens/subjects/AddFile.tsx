import { useEffect, useState } from 'react';
import Button from '../../components/core/Button';
import Modal from '../../components/overlay/Modal';
import { Dropzone, FileRow } from '../../components/content/FormBits';
import { errorMessage } from '../../components/core/Async';
import { useUploadSubjectFile } from '../../hooks/data';
import { ApiError } from '../../lib/api';
import { fileIcon } from '../../lib/mappers';
import { sizeLabel } from '../../lib/format';

/* Frame 03.5 — Add file to subject (sheet). Modal, max-width 460.
   File upload only — no link / note / scan options (README §3).
   Runs the contract's init → PUT → commit flow via useUploadSubjectFile. */

const MAX_BYTES = 20 * 1024 * 1024;

/* The picker used to offer every file on disk while the hint promised "PDF,
   DOCX, PPTX, images", so an unsupported pick only failed after the round trip.
   This narrows the dialog to what the server actually files. */
const ACCEPT = [
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.txt',
  '.md',
  '.csv',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/*',
].join(',');

/** The hidden picker behind the drawn dropzone. */
const HIDDEN_INPUT = { display: 'none' } as const;

export default function AddFile({
  open,
  onClose,
  subjectId,
  subjectCode,
}: {
  open: boolean;
  onClose: () => void;
  subjectId: string;
  subjectCode: string;
}) {
  const upload = useUploadSubjectFile();
  const [file, setFile] = useState<File | null>(null);
  const [failure, setFailure] = useState('');

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setFailure('');
  }, [open]);

  function pick(next: File | null | undefined) {
    if (!next) return;
    if (next.size > MAX_BYTES) {
      setFailure('That file is over the 20 MB limit.');
      return;
    }
    setFailure('');
    setFile(next);
  }

  function send() {
    if (!file) return;
    setFailure('');
    // kind is left off: the server files it as `notes` by default and the
    // frame draws no kind picker.
    upload.mutate(
      { subjectId, file },
      {
        onSuccess: () => onClose(),
        onError: (e) =>
          setFailure(
            e instanceof ApiError && e.notImplemented ? "File storage isn't set up yet" : errorMessage(e),
          ),
      },
    );
  }

  return (
    <Modal
      open={open}
      // Closing mid-send left the upload running with nothing on screen, which
      // read as "adding a file does nothing".
      onClose={upload.isPending ? () => {} : onClose}
      title={`Add to ${subjectCode}`}
      maxWidth={460}
      panelStyle={{ padding: '24px 26px' }}
    >
      <div
        style={{
          font: '600 12px var(--font-sans)',
          color: 'var(--text-secondary)',
          marginTop: -12,
          marginBottom: 18,
        }}
      >
        Files, notes and links Ada can read for this subject.
      </div>

      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          // The input is disabled mid-send but a drop bypasses it entirely,
          // which used to swap the staged file out from under an upload.
          if (upload.isPending) return;
          pick(e.dataTransfer.files?.[0]);
        }}
        style={{
          display: 'block',
          marginBottom: 20,
          pointerEvents: upload.isPending ? 'none' : undefined,
          opacity: upload.isPending ? 0.5 : undefined,
        }}
      >
        <input
          type="file"
          aria-label="Choose a file"
          accept={ACCEPT}
          disabled={upload.isPending}
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = '';
          }}
          style={HIDDEN_INPUT}
        />
        <Dropzone
          hint="PDF, DOCX, PPTX, images · up to 20 MB"
          style={{ borderRadius: 16, padding: '34px 20px', textAlign: 'center' }}
        />
      </label>

      {file && (
        <FileRow
          icon={fileIcon(file.type)}
          name={file.name}
          meta={`${sizeLabel(file.size) || `${file.size} B`} · ${upload.isPending ? 'uploading…' : 'ready'}`}
          trailing={upload.isPending ? null : 'check_circle'}
          sunken
          style={{ marginBottom: 20 }}
        />
      )}

      {upload.isPending && (
        <div
          role="status"
          style={{
            font: '600 11px/1.5 var(--font-sans)',
            color: 'var(--text-secondary)',
            marginTop: -8,
            marginBottom: 16,
          }}
        >
          Uploading — this can take a moment for a large file. Keep this open until it finishes.
        </div>
      )}

      {failure && (
        <div
          role="alert"
          style={{ font: '600 11px/1.5 var(--font-sans)', color: 'var(--aq-danger)', marginBottom: 16 }}
        >
          {failure}
        </div>
      )}

      <Button full onClick={send} disabled={!file} loading={upload.isPending}>
        Add file
      </Button>
    </Modal>
  );
}
