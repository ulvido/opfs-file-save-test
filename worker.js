const opfsRoot = await navigator.storage.getDirectory();

self.postMessage({ type: "WORKER_READY" })

// to clear blobs (prevent memry leaks)
let createdBlobUrls = [];

self.addEventListener("message", e => {
  console.log("workera mesaj geldi", e.data);
  switch (e.data.type) {

    case "LIST_FILES":
      // clear memory
      if(0 < createdBlobUrls.length) {
        createdBlobUrls.map(url => URL.revokeObjectURL(url));
        createdBlobUrls = [];
      };
      // get files from opfs
      navigator.storage.getDirectory()
        .then(async directoryHandle => {
          const entries = directoryHandle.values();
          // console.log(entries)
          for await (const entry of entries) {
            // console.log(entry);
            const existingFileHandle = await opfsRoot.getFileHandle(entry.name);
            const file = await existingFileHandle.getFile();
            const url = URL.createObjectURL(file);
            createdBlobUrls.push(url);
            postMessage({ type: "FILE_FROM_OPFS", payload: { filename: entry.name, url } });
          }
        });
      return;

    case "SAVE_FILE":
      let { url, name, size, type } = e.data.payload;
      // console.log(opfsRoot);
      fetch(url)
        .then(f => f.blob())
        .then(async blob => {
          const fileHandle = await opfsRoot.getFileHandle(name, { create: true });
          // Get a writable stream.
          const writable = await fileHandle.createWritable();
          // Write the contents of the file to the stream.
          await writable.write(blob);
          // Close the stream, which persists the contents.
          await writable.close();
          self.postMessage({ type: "FILE_SAVED", payload: { text: "save successfull" } })
        })
        .catch(console.error);
      return;

    case "DELETE_FILE":
      opfsRoot.getFileHandle(e.data.payload?.filename)
        .then(async fileHandle => {
          if (fileHandle) {
            await fileHandle.remove();
            postMessage({ type: "FILE_DELETED", payload: { ...e.data.payload } })
          }
        });
      return;

    default:
      self.postMessage({ type: "DEFAULT_MESSAGE", payload: { text: "merhaba" } })
      return;
  }

})
