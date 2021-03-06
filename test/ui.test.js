/* global describe, test, beforeAll, afterAll, expect */

import puppeteer from 'puppeteer'
import 'babel-polyfill'

const APP = 'http://localhost:8080/'

let browser
let page
const API_BASE_URL = 'http://127.0.0.1:5000/'

const width = 1920
const height = 1080
beforeAll(async () => {
  browser = await puppeteer.launch({
    // headless: false,
    // slowMo: 300
  })
  page = await browser.newPage()
  await page.setViewport({ width, height })
})

afterAll(() => {
  browser.close()
})

const getClass = elementHandle => page.evaluate(elem => elem.getAttribute('class'), elementHandle)

describe('Emoji buttons', () => {
  test('exist', async () => {
    await page.goto(APP)
    let buttonIds = ['entry-beaming-face-with-smiling-eyes', 'entry-grinning-face', 'entry-neutral-face', 'entry-confused-face', 'entry-disappointed-face']
    const buttons = await page
      .evaluate(buttonIds => buttonIds.map(id => document.getElementById(id).id), buttonIds)
    expect(buttons.length).toBe(5)
    expect(buttons).toEqual(buttonIds)
  })

  test('on click, active class added to emoji button and form appears', async () => {
    await page.goto(APP)
    const happyButton = await page.$('#entry-beaming-face-with-smiling-eyes')
    const form = await page.$('#entry-feedback-form')
    expect(await getClass(happyButton)).toBe('button')
    expect(await getClass(form)).toBe('feedback-form hidden')

    await happyButton.click()
    expect(await getClass(happyButton)).toBe('button active')
    expect(await getClass(form)).toBe('feedback-form')

    await happyButton.click()
    expect(await getClass(happyButton)).toBe('button')
    expect(await getClass(form)).toBe('feedback-form hidden')
  })
  test('clicking multiple emoji buttons work as expected', async () => {
    await page.goto(APP)
    let buttonIds = ['entry-beaming-face-with-smiling-eyes', 'entry-grinning-face', 'entry-neutral-face', 'entry-confused-face', 'entry-disappointed-face']
    const buttons = await Promise.all(buttonIds.map(id => page.$(`#${id}`)))
    let buttonClasses = await Promise.all(buttons.map(button => getClass(button)))
    const unclickedButtonClasses = ['button', 'button', 'button', 'button', 'button']
    const form = await page.$('#entry-feedback-form')
    expect(buttonClasses).toEqual(unclickedButtonClasses)
    expect(await getClass(form)).toBe('feedback-form hidden')

    await Promise.all(buttons.map(btn => btn.click()))
    buttonClasses = await Promise.all(buttons.map(button => getClass(button)))
    const clickedButtonClasses = ['button active', 'button active', 'button active', 'button active', 'button active']
    expect(buttonClasses).toEqual(clickedButtonClasses)
    expect(await getClass(form)).toBe('feedback-form')

    await Promise.all(buttons.map(btn => btn.click()))
    buttonClasses = await Promise.all(buttons.map(button => getClass(button)))
    expect(buttonClasses).toEqual(unclickedButtonClasses)
    expect(await getClass(form)).toBe('feedback-form hidden')
  })
  test('clicking emoji creates API request', async () => {
    await page.goto(APP)
    const happyButton = await page.$('#entry-beaming-face-with-smiling-eyes')
    await happyButton.click()
    page.on('request', req => {
      if (req.method() === 'OPTIONS') return
      expect(req.url()).toEqual(`${API_BASE_URL}emoji`)
      const jsonRes = JSON.parse(req.postData())
      expect(jsonRes.selections)
        .toEqual([ 'beaming face with smiling eyes' ])
      expect(jsonRes.eventTime).toBeDefined()
      expect(jsonRes.object).toBeDefined()
      expect(jsonRes.question).toBeDefined()
      expect(req.method()).toEqual('POST')
    })
    page.on('response', res => console.log(res))
    await page.close()
  })
  test('clicking multiple emojis create correct API request', async () => {
    // have to create a new page because the page.on('request') can't be programmatically destroyed
    page = await browser.newPage()
    await page.setViewport({ width, height })
    await page.goto(APP)
    const happyButton = await page.$('#entry-beaming-face-with-smiling-eyes')
    const disappointedButton = await page.$('#entry-disappointed-face')
    await happyButton.click()
    await disappointedButton.click()
    page.on('request', req => {
      if (req.method() === 'OPTIONS') return
      expect(req.url()).toEqual(`${API_BASE_URL}emoji`)
      const jsonRes = JSON.parse(req.postData())
      expect(jsonRes.selections)
        .toEqual([ 'beaming face with smiling eyes', 'disappointed face' ])
      expect(jsonRes.eventTime).toBeDefined()
      expect(jsonRes.object).toBeDefined()
      expect(jsonRes.question).toBeDefined()
      expect(req.method()).toEqual('POST')
    })
    await page.close()
  })
  test('clicking an emoji that was already clicked previously removes it from POST payload', async () => {
    page = await browser.newPage()
    await page.setViewport({ width, height })
    await page.goto(APP)
    const happyButton = await page.$('#entry-beaming-face-with-smiling-eyes')
    const disappointedButton = await page.$('#entry-disappointed-face')
    await happyButton.click()
    await disappointedButton.click()
    await disappointedButton.click()
    page.on('request', req => {
      if (req.url() === 'http://127.0.0.1:5000/emoji') {
        if (req.method() === 'OPTIONS') return
        const jsonRes = JSON.parse(req.postData())
        expect(jsonRes.selections)
          .toEqual([ 'beaming face with smiling eyes' ])
        expect(jsonRes.eventTime).toBeDefined()
        expect(jsonRes.object).toBeDefined()
        expect(jsonRes.question).toBeDefined()
        expect(req.method()).toEqual('POST')
      }
    })
    await page.close()
  })
})

describe('form', () => {
  test('can be filled out', async () => {
    page = await browser.newPage()
    await page.setViewport({ width, height })
    await page.goto(APP)
    const happyButton = await page.$('#entry-beaming-face-with-smiling-eyes')
    await happyButton.click()
    const form = await page.$('#entry-feedback-textarea')
    const submitButton = await page.$('#entry-feedback-button')
    expect(await getClass(submitButton)).toBe('button feedback-button')
    await form.type('hello')
    expect(await getClass(submitButton)).toBe('button feedback-button ready')
    const charCounter = await page.evaluate(() => document.querySelector('#entry-maxlength-enforcer > span').innerHTML)
    expect(charCounter).toEqual('5')
  })

  test('submits properly, making correct POST request', async () => {
    page.on('request', req => {
      if (req.method() === 'OPTIONS') return
      if (req.url() === `${API_BASE_URL}feedback`) {
        expect(JSON.parse(req.postData()).feedback).toEqual('hello')
        expect(req.method()).toEqual('POST')
      }
    })
    await page.goto(APP)
    const happyButton = await page.$('#entry-beaming-face-with-smiling-eyes')
    await happyButton.click()
    const form = await page.$('#entry-feedback-textarea')
    const submitButton = await page.$('#entry-feedback-button')
    await form.type('hello')
    await submitButton.click()
    await Promise.race([
      page.waitFor('#entry-thank-you-message'),
      page.waitFor('#entry-error-message')
    ])
    const thankYouMessage = await page.evaluate(() => {
      const msg = document.getElementById('entry-thank-you-message')
      return msg ? msg.innerHTML : false
    })
    const errorMessage = await page.evaluate(() => {
      const msg = document.getElementById('entry-error-message')
      return msg ? msg.innerHTML : false
    })
    if (thankYouMessage) {
      expect(thankYouMessage).toBe('Your feedback has been recorded.')
      expect(await page.evaluate(() => document.getElementById('entry-wrapper'))).toBeNull()
    }
    if (errorMessage) {
      expect(errorMessage).toBe('Our servers are having some issues. Please vote again later.')
      expect(await page.evaluate(() => document.getElementById('entry-wrapper'))).toBeNull()
    }
    await page.close()
  })
})
