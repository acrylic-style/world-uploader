const picker = document.getElementById('picker')
const listing = document.getElementById('listing')
const box = document.getElementById('box')
const elem = document.getElementById('myBar')
const discord = document.getElementById('discord')
const description = document.getElementById('description')
let counter = 0
let total = 0
let paused = false
let selected = false

function sendFile(file, prefix, path, root, last, callback) {
  if (paused) return
  if (!selected || !/^.*#\d{4}$/.test(discord.value)) throw new Error('Condition is not met yet.')
  const item = document.createElement('li')
  const formData = new FormData()
  const request = new XMLHttpRequest()
  request.responseType = 'text'
  request.onload = function() {
    try {
      if (request.readyState === request.DONE) {
        if (request.status === 200) {
          console.log(request.responseText)
          counter++
          item.textContent = request.responseText + ' (' + counter + ' / ' + total + ')'
          listing.appendChild(item)
          box.textContent = Math.min(counter / total * 100, 100).toFixed(2) + '%'
          elem.textContent = Math.round(counter / total * 100, 100) + '%'
          elem.style.width = Math.round(counter / total * 100) + '%'
        } else {
          box.textContent = 'アップロード中にエラーが発生しました。'
          paused = true
          return
        }
        if (counter >= total) {
          elem.textContent = '100%'
          box.textContent = total + '個のファイルのアップロードが完了しました。 アップロードID: ' + root
          elem.style.width = '100%'
        } else {
          callback(counter >= (total - 1))
        }
      }
    } catch (e) {
      console.error(e.stack || e)
      box.textContent = 'アップロード中にエラーが発生しました。'
      paused = true
    }
  }
  formData.set('file', file)
  formData.set('prefix', prefix)
  formData.set('path', path)
  formData.set('last', last ? 'yes' : 'no')
  formData.set('root', root)
  formData.set('discord', discord.value)
  formData.set('description', description.value)
  request.open('POST', 'api/process.php')
  request.send(formData)
}

/**
 * @type {{[name: string]: { requires: Number, version: string }}}
 */
const table = {
  tosogame: {
    requires: 1343,
    version: '1.12.2',
  },
  witherescape: {
    requires: 922,
    version: '1.11.2',
  },
  splatoon: {
    requires: 922,
    version: '1.11.2',
  },
  villagerdefence: {
    requires: 922,
    version: '1.11.2',
  },
  gundomination: {
    requires: 922,
    version: '1.11.2',
  },
  ctf: {
    requires: 0,
    version: '1.8.x',
  },
  kartrace: {
    requires: 0,
    version: '1.8.x',
  },
  cbp: {
    requires: 0,
    version: '1.8.x',
  },
  castlesiege: {
    requires: 0,
    version: '1.8.x',
  },
  rushv2: {
    requires: 0,
    version: '1.8.x',
  },
}

picker.addEventListener('change', () => {
  box.textContent = '0%'
  elem.style.width = '0px'
  listing.innerHTML = ''
  total = picker.files.length
  counter = 0
  paused = false
  let kikaku = document.querySelector('label[class~=active]')
  if (!kikaku) {
    box.textContent = '企画が選択されていません。'
    return
  }
  if (kikaku.classList.contains('btn')) kikaku = kikaku.firstChild
  if (!table[kikaku.value]) {
    box.textContent = '企画が選択されていません。'
    return
  }
  const data = table[kikaku.value]
  // pre-check
  if (total > 100) {
    box.textContent = '100個以上のファイルはアップロードできません。'
    return
  }
  let leveldat = false
  let mca = false
  let invalid = false
  let bytes = 0
  for (let i = 0; i < picker.files.length; i++) {
    const file = picker.files[i]
    const isRoot = file.webkitRelativePath.match(/\//g).length == 1
    if (isRoot && file.name === 'level.dat') leveldat = file
    if (file.name.endsWith('.mca')) mca = true
    if (file.name.endsWith('.php') || file.name.endsWith('.gif')) invalid = true
    bytes += file.size
  }
  if (!leveldat || !mca || invalid) {
    box.textContent = 'このワールドは無効なワールドです。'
    return
  }
  const root = /(.*?)\/.*/.exec(leveldat.webkitRelativePath)[1]
  if (bytes > 1024*1024*50) { // 50m
    box.textContent = '合計サイズが50MB以下でないと送信できません。'
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const ab = reader.result
    window.nbt.parse(ab, (error, result) => {
      if (error || !result.value.Data) {
        box.textContent = 'ワールドデータを読み込めません。'
        return
      }
      const v1_8 = !result.value.Data.value.Version
      const snapshot = v1_8 ? false : result.value.Data.value.Version.value.Snapshot.value
      const dataVersion = v1_8 ? 0 : result.value.Data.value.Version.value.Id.value
      if (snapshot) {
        box.textContent = 'スナップショットのワールドはアップロードできません。'
        return
      }
      if (data.requires !== dataVersion) {
        box.textContent = `非対応のバージョンです。対応バージョン: ${data.version}`
        return
      }
      // do upload
      const rootName = root + Math.round(Math.random()*10000)
      let i = -1
      const next = last => {
        i++
        const file = picker.files[i]
        sendFile(file, kikaku.value, file.webkitRelativePath, rootName, last, next)
      }
      next(false)
    })
  }
  reader.readAsArrayBuffer(leveldat)
})

const check = () => {
  if (selected && /^.*#\d{4}$/.test(discord.value)) {
    document.getElementById('picker').disabled = false
  } else {
    document.getElementById('picker').disabled = true
  }
}

document.getElementById('kikaku').childNodes.forEach(node => node.onclick = () => {
  selected = true
  check()
})

discord.oninput = () => { check() }
