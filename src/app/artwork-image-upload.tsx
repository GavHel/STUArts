import { useId, useState } from "react";
import { ARTWORK_IMAGE_TYPES, MAX_ARTWORK_IMAGE_BYTES } from "@/lib/artwork-image-validation";
import styles from "./admin/admin.module.css";

export function imageFileError(file: File | null) {
  if (!file) return "";
  if (!ARTWORK_IMAGE_TYPES.some((type) => type === file.type)) return "Choose a JPEG, PNG, or WebP image.";
  if (file.size === 0 || file.size > MAX_ARTWORK_IMAGE_BYTES) return "The image must be nonempty and 5 MiB or smaller.";
  return "";
}

export function useArtworkImage() {
  const [file, setFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);

  function resetFile() {
    setFile(null);
    setInputKey((key) => key + 1);
  }

  return { file, setFile, inputKey, resetFile };
}

export function artworkRequestBody(payload: object, file: File | null) {
  if (!file) {
    return {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    };
  }

  const body = new FormData();
  body.append("data", JSON.stringify(payload));
  body.append("image", file);
  return { body };
}

export function ArtworkImageUpload({
  file,
  inputKey,
  onChange,
  disabled,
}: {
  file: File | null;
  inputKey: number;
  onChange: (file: File | null) => void;
  disabled: boolean;
}) {
  const descriptionId = useId();
  const errorId = useId();
  const error = imageFileError(file);

  return (
    <div className={styles.uploadField}>
      <label>
        Upload artwork image
        <input
          accept="image/jpeg,image/png,image/webp"
          aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ""}`}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          key={inputKey}
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          type="file"
        />
      </label>
      <small id={descriptionId}>
        JPEG, PNG, or WebP, up to 5 MiB. A selected file overrides the image URL.
        Uploads are private until both the artwork and artist are published.
      </small>
      {error && <p className={styles.uploadError} id={errorId} role="alert">{error}</p>}
    </div>
  );
}
