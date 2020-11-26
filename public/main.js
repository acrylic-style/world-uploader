const picker = document.getElementById('picker')
const listing = document.getElementById('listing')
const box = document.getElementById('box')
const elem = document.getElementById('myBar')
let counter = 1
let total = 0

function sendFile(file, path) {
  const item = document.createElement('li')
  const formData = new FormData()
  const request = new XMLHttpRequest()
  request.responseType = 'text'
  request.onload = function() {
    if (request.readyState === request.DONE) {
      if (request.status === 200) {
        console.log(request.responseText)
        item.textContent = request.responseText
        listing.appendChild(item)
        listing.textContent = request.responseText + ' (' + counter + ' / ' + total + ' ) '
        box.textContent = Math.min(counter / total * 100, 100).toFixed(2) + '%'
        elem.textContent = Math.round(counter / total * 100, 100) + '%'
        elem.style.width = Math.round(counter / total * 100) + '%'
      }
      if (++counter >= total) {
        box.textContent = total + '個のファイルのアップロードが完了しました。'
      }
    }
  }
  formData.set('file', file)
  formData.set('path', path)
  request.open('POST', 'api/process.php')
  request.send(formData)
}

picker.addEventListener('change', () => {
  box.textContent = '0%'
  elem.style.width = '0px'
  listing.innerHTML = 'None'
  total = picker.files.length
  counter = 1
  // pre-check
  if (total > 100) {
    box.textContent = '100個以上のファイルはアップロードできません。'
    return
  }
  let leveldat = false
  let mca = false
  for (let i = 0; i < picker.files.length; i++) {
    const file = picker.files[i]
    console.log(file.webkitRelativePath)
    const isRoot = file.webkitRelativePath.match(/\//g).length == 1
    if (isRoot && file.name === 'level.dat') leveldat = file
    if (file.name.endsWith('.mca')) mca = true
  }
  if (!leveldat || !mca) {
    box.textContent = 'このワールドは無効なワールドです。'
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const ab = reader.result
    console.log(ab)
    window.nbt.parse(ab, (error, result) => {
      console.log(error)
      const v1_8 = !result.value.Data.value.Version
      const snapshot = v1_8 ? false : result.value.Data.value.Version.value.Snapshot.value
      const dataVersion = v1_8 ? 0 : result.value.Data.value.Version.value.Id.value
      // do upload
      for (let i = 0; i < picker.files.length; i++) {
        const file = picker.files[i]
        sendFile(file, file.webkitRelativePath)
      }
    })
  }
  reader.readAsArrayBuffer(leveldat)
})
