// Chunked upload for the server's /api/uploadMediaFile: multipart "file" field and a Content-Range
// header. The server appends each chunk, and removes the previous media file on the first one.
const CHUNK_SIZE = 50 * 1024 * 1024;

function sendChunk(url: string, file: File, start: number, onProgress: (percent: number) => void) {
  const end = Math.min(start + CHUNK_SIZE, file.size);
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Range", `bytes ${start}-${Math.max(end - 1, 0)}/${file.size}`);
    // `loaded` includes the multipart overhead, so it can go slightly over the chunk size
    xhr.upload.onprogress = (e) => onProgress(Math.min(100, ((start + e.loaded) / (file.size || 1)) * 100));
    xhr.onload = () =>
      xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Upload failed: the player isn't responding"));
    const form = new FormData();
    form.append("file", file.slice(start, end), file.name);
    xhr.send(form);
  });
}

export async function uploadChunked(url: string, file: File, onProgress: (percent: number) => void) {
  let start = 0;
  do {
    await sendChunk(url, file, start, onProgress);
    start += CHUNK_SIZE;
  } while (start < file.size);
}
