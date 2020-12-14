const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)

// get time in EST
var now = dayjs.utc().tz('America/New_York')
// 1 = monday, ..., 7 = sunday
const day = (now.day() + 6) % 7 + 1
// fraction hour to the nearest minute
const hr = now.hour() + now.minute() / 60.0
console.log('now: ' + now.format())
console.log('day: ' + day)
console.log('hour: ' + hr)

// figure out if it is "today"
var today = false
if (hr >= 20.5) {
  today = true
}
console.log('today: ' + today)

now = now.hour(0).minute(0).second(0)

// arXiv "logic" for sending out new articles
// see this (http://arxiv.org/help/submit) and draw a picture
var de
var ds
if (day === 7) {
  // sunday
  if (today) {
    // night, so seeing stuff submitted from thurs 16:00 to fri 16:00
    de = now.add(16 - 2 * 24, 'h')
    ds = de.add(-24, 'h')
  } else {
    // day, so seeing stuff from wed 16:00 to thurs 16:00
    de = now.add(16 - 3 * 24, 'h')
    ds = de.add(-24, 'h')
  }
} else if (day === 1) {
  // monday
  if (today) {
    // monday night, see stuff from fri 16:00 to mon 16:00
    de = now.add(16, 'h')
    ds = de.add(-24 * 3, 'h')
  } else {
    // monday day, seeing stuff from thurs 16:00 to fri 1600
    de = now.add(16 - 3 * 24, 'h')
    ds = de.add(-24, 'h')
  }
} else if (day === 2) {
  // tuesday
  if (today) {
    // tuesday night is normal (monday 16 to tues 16)
    de = now.add(16, 'h')
    ds = de.add(-24, 'h')
  } else {
    // tues during day is fri 16 to mon 16
    de = now.add(-8, 'h')
    ds = de.add(-24 * 3, 'h')
  }
} else if (day === 5) {
  // friday - no new stuff - so always see thursday night stuff (so wed 16:00 to thurs 16:00)
  de = now.add(16 - 24, 'h')
  ds = de.add(-24, 'h')
} else if (day === 6) {
  // sat - no new stuff - so always see thursday night stuff (so wed 16:00 to thurs 16:00)
  de = now.add(16 - 24 * 2, 'h')
  ds = de.add(24, 'h')
} else {
  // all other days are "normal"
  if (today) {
    de = now.add(16, 'h')
  } else {
    de = now.add(-8, 'h')
  }
  ds = de.add(-24, 'h')
}
console.log('ds: ' + ds)
console.log('de: ' + de)

// https://stackoverflow.com/questions/1787322/htmlspecialchars-equivalent-in-javascript
function escapeHtml (text) {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }

  return text.replace(/[&<>"']/g, function (m) { return map[m] })
}

function htmlDecode (input) {
  var e = document.createElement('textarea')
  e.innerHTML = input
  // handle case of empty input
  return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue
}

const feedURL = 'https://api.rss2json.com/v1/api.json?rss_url=http%3A%2F%2Fexport.arxiv.org%2Frss%2Fastro-ph&api_key=io4ysvap45khsblw1vpswkdz0fym8wusye2gumeg&count=100'

function loadArXivJSON () {
  var xobj = new XMLHttpRequest()
  xobj.overrideMimeType('application/json')
  xobj.open('GET', feedURL, true)
  xobj.onreadystatechange = function () {
    if (xobj.readyState === 4 && xobj.status === 200) {
      // Required use of an anonymous callback as .open will NOT
      // return a value but simply returns undefined in asynchronous mode
      parseFeed(xobj.responseText)
    }
  }
  xobj.send(null)
}

function parseFeed (feedText) {
  const feed = JSON.parse(feedText)

  console.log(feed.items.length)
  var container = document.getElementById('feed')
  var tdiv = document.createElement('div')
  tdiv.className = 'timestamp'
  tdiv.innerHTML = (
    'Showing ' +
    feed.items.length +
    ' posts from ' +
    ds.format('ddd, D MMM YYYY HH:mm:ss') +
    ' EDT to ' +
    de.format('ddd, D MMM YYYY HH:mm:ss') +
    ' EDT.'
  )
  container.appendChild(tdiv)

  var entry
  var i
  var entries = []
  for (i = 0; i < feed.items.length; i++) {
    entry = feed.items[i]
    if (!entry.title.includes('UPDATED')) {
      entries.push(entry)
    }
  }
  entries = entries.sort(() => Math.random() - 0.5)

  var row, col, par, title, num, div
  for (i = 0; i < entries.length; i++) {
    entry = entries[i]

    if (i % 2 === 0) {
      row = document.createElement('div')
      row.className = 'row'
      container.appendChild(row)
    }

    col = document.createElement('div')
    col.className = 'col-xs-12 col-sm-12 col-md-6 col-lg-6'
    row.appendChild(col)

    par = document.createElement('p')
    col.appendChild(par)
    par.className = 'lead tex2jax_proces'

    title = entry.title.split(' (arXiv', 1)[0]
    num = entry.link.split('/abs/')[1]
    par.innerHTML = (
      '<a href="https://arxiv.org/abs/' + num + '">' +
      num +
      '</a>' +
      ' [<a href="https://arxiv.org/pdf/' + num + '">pdf</a>]' +
      ': <span class="title">' +
      title +
      '</span>'
    )

    div = document.createElement('div')
    col.appendChild(div)
    div.className = 'authors'
    div.innerHTML = htmlDecode(entry.author)

    div = document.createElement('div')
    col.appendChild(div)
    div.className = 'abs tex2jax_process'
    div.innerHTML = escapeHtml(entry.description.replace(/(<([^>]+)>)/gi, ''))
  }
}

loadArXivJSON()
