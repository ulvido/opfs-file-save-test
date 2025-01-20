// SERVICE WORKER
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js")
    .then(registration => {
      console.log("SW registered!", registration);
    })
    .catch(console.error);
} else {
  console.log("Service Workers not supported!");
}

// WORKER
let worker = new Worker("worker.js", { type: "module" });
worker.addEventListener("message", e => {
  console.log(e.data);

  switch (e.data?.type) {

    case "WORKER_READY":
    case "FILE_SAVED":
    case "FILE_DELETED":
      // refresh file list
      refreshList();
      break;

    case "FILE_FROM_OPFS":
      let li = document.createElement("li");
      li.style.marginBottom = "8px";

      let a = document.createElement("a");
      a.href = e.data.payload.url;
      a.innerHTML = e.data.payload.filename;
      a.target = "_blank";
      li.appendChild(a)

      let inp = document.createElement("input");
      inp.type = "button";
      inp.value = "Sil"
      inp.style.marginLeft = "10px";
      inp.addEventListener("click", _ => {
        worker.postMessage({ type: "DELETE_FILE", payload: { filename: e.data.payload.filename } })
      });
      li.appendChild(inp);
      files.appendChild(li);
      break;

    default:
      break;
  }
});

// HELPERS
const refreshList = () => {
  files.innerHTML = "";
  worker.postMessage({ type: "LIST_FILES" })
}

// ELEMENTS
let inputFile = document.getElementById("input-file");
let btnSave = document.getElementById("btn-save");
let btnList = document.getElementById("btn-list");
let files = document.getElementById("files");

// EVENTS
self.addEventListener("DOMContentLoaded", e => {
  btnSave.disabled = true;
})

btnList.addEventListener("click", e => {
  files.innerHTML = "";
  worker.postMessage({ type: "LIST_FILES" })
})

inputFile.addEventListener("change", e => {
  console.log(e.target.files[0])
  if (e.target.files[0]) {
    btnSave.disabled = false;
  } else {
    btnSave.disabled = true;
  }
})

btnSave.addEventListener("click", e => {
  // console.log(e.target.value)
  // console.log(inputFile.value)
  const file = inputFile.files[0];
  let url = URL.createObjectURL(file);
  console.log(url);
  let { name, size, type } = file;
  console.log(name, size, type)
  worker.postMessage({ type: "SAVE_FILE", payload: { url, name, size, type } })
  // clear inputs
  inputFile.value = "";
  btnSave.disabled = true;
})
