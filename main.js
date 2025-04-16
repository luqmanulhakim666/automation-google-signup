const puppeteer = require('puppeteer-extra')
const puppeteerStealth = require('puppeteer-extra-plugin-stealth')
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args))

puppeteer.use(puppeteerStealth())

function generateUsername(firstName, lastName) {
  const randomNum = Math.floor(10000 + Math.random() * 90000)
  return `${firstName.toLowerCase()}${lastName.toLowerCase()}${randomNum}`
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const firstNames = [
  'John',
  'Jane',
  'Alex',
  'Emily',
  'Michael',
  'Sarah',
  'David',
  'Laura'
]
const lastNames = [
  'Doe',
  'Smith',
  'Johnson',
  'Lee',
  'Brown',
  'Wilson',
  'Clark',
  'Taylor'
]

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function getValidPhoneNumber(page) {
  let attempts = 0

  while (attempts < 5) {
    const params = new URLSearchParams()
    params.append('country', 9)
    params.append('service', 395)
    params.append('quantity', 1)
    params.append('create_token', 0)

    console.log('📱 Fetching phone number from SMSPool...')
    const response = await fetch('https://api.smspool.net/purchase/sms', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer H2B1ayshZAoYszxaIseSFyFruXxblBhs',
        ContentType: 'application/json'
      },
      body: params
    })

    const data = await response.json()

    if (!data.success) {
      console.error('❌ Failed to retrieve phone number from SMSPool:', data)
      return null
    }

    const phoneNumber = data.phonenumber.toString()
    const orderId = data.order_id
    console.log(`📞 Got phone number: ${phoneNumber}`)

    // Clear input before retyping
    await page.evaluate(() => {
      const input = document.querySelector('input[type="tel"]')
      input.value = ''
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await page.type('input[type="tel"]', phoneNumber)
    await delay(1000)

    console.log('➡️ Clicking "Next" after phone input...')
    await page.click('button[jsname="LgbsSe"]')
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})

    // Check if number was rejected
    const phoneRejected = await page.evaluate(() => {
      const errEl = document.querySelector('.Ekjuhf.Jj6Lae')
      return (
        errEl &&
        errEl.innerText.includes(
          'This phone number cannot be used for verification.'
        )
      )
    })

    if (phoneRejected) {
      console.log('🚫 Phone number rejected. Refetching a new one...')

      // Cancel the number on SMSPool
      await fetch(`https://api.smspool.net/cancel?smsid=${orderId}`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer H2B1ayshZAoYszxaIseSFyFruXxblBhs'
        }
      })

      // Stay on the same page and retry
      attempts++
      await delay(1500)
    } else {
      console.log('✅ Phone number accepted!')
      return { phoneNumber, orderId }
    }
  }

  console.error('❌ Failed to get valid phone number after 5 attempts.')
  return null
}

async function runSignup() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--proxy-server=http://gw.dataimpulse.com:10000'
    ]
  })

  const page = await browser.newPage()

  await page.authenticate({
    username: 'ad943c79fedb916b9228__cr.id',
    password: '8ce5da5020809fd7'
  })

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  )

  console.log('🌀 Opening Google Signup page...')
  await page.goto('https://accounts.google.com/signup', {
    waitUntil: 'networkidle2'
  })

  const firstName = getRandomItem(firstNames)
  const lastName = getRandomItem(lastNames)
  const username = generateUsername(firstName, lastName)
  const password = '@Admin12345'

  console.log('✍️  Filling first and last name...')
  await page.type('input[name="firstName"]', firstName)
  await delay(1000)
  await page.type('input[name="lastName"]', lastName)
  await delay(1000)

  console.log('➡️  Clicking first "Next"...')
  await page.waitForSelector('button[jsname="LgbsSe"]', { visible: true })
  await page.click('button[jsname="LgbsSe"]')
  await page.waitForNavigation({ waitUntil: 'networkidle2' })

  console.log('📆 Filling in birthdate...')
  await page.waitForSelector('select#month', { visible: true })
  await page.select('select#month', '1')
  await page.type('input#day', '15')
  await page.type('input#year', '1995')

  console.log('🚻 Selecting gender...')
  await page.waitForSelector('select#gender', { visible: true })
  await page.select('select#gender', '1')
  await delay(1000)

  console.log('➡️  Clicking second "Next"...')
  await page.click('button[jsname="LgbsSe"]')
  await page.waitForNavigation({ waitUntil: 'networkidle2' })

  console.log(`👤 Filling in username: ${username}`)
  await page.waitForSelector('input[name="Username"]', { visible: true })
  await page.type('input[name="Username"]', username)
  await delay(1000)

  console.log('➡️  Clicking third "Next"...')
  await page.click('button[jsname="LgbsSe"]')
  await page.waitForNavigation({ waitUntil: 'networkidle2' })

  console.log('🔐 Filling in password...')
  await page.waitForSelector('input[name="Passwd"]', { visible: true })
  await page.type('input[name="Passwd"]', password, { delay: 100 })

  console.log('🔐 Confirming password...')
  await page.waitForSelector('input[name="PasswdAgain"]', { visible: true })
  await page.type('input[name="PasswdAgain"]', password, { delay: 100 })
  await delay(1000)

  console.log('➡️  Clicking final "Next"...')
  await page.click('button[jsname="LgbsSe"]')
  await page.waitForNavigation({ waitUntil: 'networkidle2' })

  // ✅ Check for error page
  const errorDetected = await page
    .$eval('body', (body) => {
      const errorEl = body.querySelector('div.dMNVAe')
      return (
        errorEl &&
        errorEl.innerText.includes(
          'Sorry, we could not create your Google Account.'
        )
      )
    })
    .catch(() => false)

  if (errorDetected) {
    console.log('❌ Error page detected. Restarting...')
    await browser.close()
    return false
  }

  console.log('📲 Waiting for phone number input...')
  await page.waitForSelector('input[type="tel"]', { visible: true })

  const phoneInfo = await getValidPhoneNumber(page)
  if (!phoneInfo) {
    console.log('❌ Failed to get a valid phone number. Exiting.')
    await browser.close()
    return false
  }

  console.log(`📞 Got valid phone number: ${phoneInfo.phoneNumber}`)
  await page.type('input[type="tel"]', phoneInfo.phoneNumber)
  await delay(1000)

  console.log('➡️ Clicking "Next" after phone input...')
  await page.click('button[jsname="LgbsSe"]')
  await page.waitForNavigation({ waitUntil: 'networkidle2' })

  console.log('🕵️ Checking for QR Code verification screen...')
  try {
    await page.waitForSelector('span[jsslot]', { timeout: 10000 })
    const qrText = await page.$eval('span[jsslot]', (el) => el.textContent)

    if (qrText.includes('Scan QR Code to verify your phone number')) {
      console.log('🚫 QR Code verification detected! Restarting...')
      await browser.close()
      return false
    }
  } catch (e) {
    console.log('⏱️ No QR code detected, proceeding...')
  }

  console.log(
    '🎉 Account signup passed all checks! Continue your workflow here.'
  )
  await browser.close()
  return true
}

;(async () => {
  let success = false
  let attempt = 0

  while (!success && attempt < 5) {
    console.log(`\n🔁 Attempt ${attempt + 1} starting...\n`)
    success = await runSignup()
    attempt++

    if (!success) {
      console.log('🔄 Restarting due to QR or error page...')
      await delay(3000)
    }
  }

  if (!success) {
    console.log('❌ Reached max retries. Exiting.')
  } else {
    console.log('✅ Signup completed successfully.')
  }
})()
