/* global describe, test, expect, Event, jest */
import controller from '../src/app'
// import { deepFreeze } from '../src/util'
import * as c from '../src/defaults'

// const frozenDefaultState = deepFreeze(defaultState)

jest.mock('../src/api')

describe('app', () => {
  test('should have method: init', () => {
    const app = controller()
    expect(typeof app.init).toEqual('function')
  })

  test('should have method: getState', () => {
    const app = controller()
    expect(typeof app.getState).toEqual('function')
  })

  test('should throw error if entryId (first param) is not specified', () => {
    const app = controller()
    const expectedError = () => {
      app.init()
    }
    expect(expectedError).toThrowError('entryId must be specified')
  })

  test('should throw error if endpoints (second param) is not specified', () => {
    const app = controller()
    const expectedError = () => {
      app.init('entryId')
    }
    expect(expectedError).toThrowError('endpoints must be specified')
  })

  test('should throw error if element with ID (entry point of app) does not exist', () => {
    const app = controller()
    const expectedError = () => {
      app.init('entry', {})
    }
    expect(expectedError).toThrowError('The specified element with id does not exist')
  })
})

describe('app state', () => {
  test('getState should return default state', () => {
    const app = controller()
    const state = app.getState()
    expect(state).toEqual(c.createDefaultState())
  })

  test('entry state should set correctly', () => {
    const entrypoint = 'myEntryId'
    const endpoints = {
      emoji: 'http://localhost:8080/emoji',
      feedback: 'http://localhost:8080/feedback',
      votes: 'http://localhost:8080/votes'
    }
    document.body.innerHTML = `<div id=${entrypoint}></div>`

    const app = controller()
    app.init(entrypoint, endpoints, {})

    const appState = app.getState()

    expect(appState).toEqual({
      ...c.createDefaultState(),
      emojis: c.defaultEmojis,
      entryId: 'myEntryId',
      endpoints,
      text: {
        introText: c.introText,
        feedbackTextPrompt: c.feedbackTextPrompt,
        feedbackThankYou: c.feedbackThankYou
      }
    })
  })

  test('multiple instances of app should not impact each app state', () => {
    const entrypoint1 = 'myEntryId1'
    const entrypoint2 = 'myEntryId2'
    const endpoints1 = {
      emoji: 'http://localhost:8080/emoji',
      feedback: 'http://localhost:8080/feedback',
      votes: 'http://localhost:8080/votes'
    }
    const endpoints2 = {
      emoji: 'http://localhost:8080/emoji1',
      feedback: 'http://localhost:8080/feedback2',
      votes: 'http://localhost:8080/votes3'
    }
    document.body.innerHTML = `<div id=${entrypoint1}></div><div id=${entrypoint2}></div>`

    const app1 = controller()
    const app2 = controller()
    app1.init(entrypoint1, endpoints1, {})
    app2.init(entrypoint2, endpoints2, {})

    const app1ExpectedState = {
      ...c.createDefaultState(),
      emojis: c.defaultEmojis,
      entryId: entrypoint1,
      endpoints: endpoints1,
      text: {
        introText: c.introText,
        feedbackTextPrompt: c.feedbackTextPrompt,
        feedbackThankYou: c.feedbackThankYou
      }
    }

    const app2ExpectedState = {
      ...c.createDefaultState(),
      emojis: c.defaultEmojis,
      endpoints: endpoints2,
      entryId: entrypoint2,
      text: {
        introText: c.introText,
        feedbackTextPrompt: c.feedbackTextPrompt,
        feedbackThankYou: c.feedbackThankYou
      }
    }
    expect(app1ExpectedState).toEqual(app1.getState())
    expect(app2ExpectedState).toEqual(app2.getState())
  })
})

describe('emoji', () => {
  const app = controller()
  const entrypoint = 'entry'
  const endpoints = {
    emoji: 'http://localhost:8080/emoji',
    feedback: 'http://localhost:8080/form',
    votes: 'http://localhost:8080/votes'
  }
  const setupButton = () => {
    document.body.innerHTML = `<div id=${entrypoint}></div>`
    app.init(entrypoint, endpoints, { emojis: c.defaultEmojis })
    const emojiButtonId1 = document.getElementById(`${entrypoint}-${c.defaultEmojis[0].emotion}`)
    return emojiButtonId1
  }
  test('clicking an emoji updates the state correctly', () => {
    setupButton().click()
    const expectedState = {
      ...c.createDefaultState(),
      emojis: c.defaultEmojis,
      text: {
        introText: c.introText,
        feedbackTextPrompt: c.feedbackTextPrompt,
        feedbackThankYou: c.feedbackThankYou
      },
      responses: {
        selectedEmojis: [{ emojiId: `${entrypoint}-${c.defaultEmojis[0].emotion}`, emojicon: c.defaultEmojis[0].emojicon }],
        writtenFeedback: ''
      },
      endpoints: endpoints,
      entryId: entrypoint
    }
    expect(app.getState()).toEqual(expectedState)
  })
  test('clicking the same emoji again removes it from selectedEmojis', () => {
    setupButton().click()
    const expectedState = {
      ...c.createDefaultState(),
      endpoints: endpoints,
      entryId: entrypoint,
      emojis: c.defaultEmojis,
      text: {
        introText: c.introText,
        feedbackTextPrompt: c.feedbackTextPrompt,
        feedbackThankYou: c.feedbackThankYou
      }
    }
    expect(app.getState()).toEqual(expectedState)
  })
})

describe('form', () => {
  const entrypoint = 'entry'
  const endpoints = {
    emoji: 'http://localhost:8080/emoji',
    feedback: 'http://localhost:8080/feedback',
    votes: 'http://localhost:8080/votes'
  }

  test('when textarea is filled out, the application state changes accordingly as well as char counter', () => {
    const app = controller()
    document.body.innerHTML = `<div id=${entrypoint}></div>`
    app.init(entrypoint, endpoints, { emojis: c.defaultEmojis })
    const emojiButtonId1 = document.getElementById(`${entrypoint}-${c.defaultEmojis[0].emotion}`)
    emojiButtonId1.click()
    const textarea = document.getElementById(`${entrypoint}-feedback-textarea`)
    const submitButton = document.getElementById(`${entrypoint}-feedback-button`)
    const sampleText = 'Adding text in here should update state and char counter accordingly'
    const charCounter = document.getElementById(`${entrypoint}-maxlength-enforcer`)

    expect(submitButton.classList.contains('ready')).toEqual(false)
    textarea.value = sampleText
    textarea.dispatchEvent(new Event('keyup'))

    expect(app.getState().responses.writtenFeedback).toEqual(sampleText)
    expect(charCounter.innerHTML).toEqual(`<span>${sampleText.length}</span>/500`)
    expect(submitButton.classList.contains('ready')).toEqual(true)
  })

  test('when textarea is filled out, then textarea is deleted, the submit button ready class should be removed', () => {
    const app = controller()
    document.body.innerHTML = `<div id=${entrypoint}></div>`
    app.init(entrypoint, endpoints)
    const emojiButtonId1 = document.getElementById(`${entrypoint}-${c.defaultEmojis[0].emotion}`)
    emojiButtonId1.click()
    const textarea = document.getElementById(`${entrypoint}-feedback-textarea`)
    const submitButton = document.getElementById(`${entrypoint}-feedback-button`)
    const sampleText = 'hello'
    const charCounter = document.getElementById(`${entrypoint}-maxlength-enforcer`)

    expect(submitButton.classList.contains('ready')).toEqual(false)
    textarea.value = sampleText
    textarea.dispatchEvent(new Event('keyup'))

    textarea.value = ''
    textarea.dispatchEvent(new Event('keyup'))
    expect(app.getState().responses.writtenFeedback).toEqual('')
    expect(charCounter.innerHTML).toEqual(`<span>0</span>/500`)
    expect(submitButton.classList.contains('ready')).toEqual(false)
  })

  test('when submit button is pressed, the thank you message shows up', async () => {
    const app = controller()
    document.body.innerHTML = `<div id=${entrypoint}></div>`
    app.init(entrypoint, endpoints)
    const emojiButtonId1 = document.getElementById(`${entrypoint}-${c.defaultEmojis[0].emotion}`)
    emojiButtonId1.click()
    const textarea = document.getElementById(`${entrypoint}-feedback-textarea`)
    const submitButton = document.getElementById(`${entrypoint}-feedback-button`)
    const sampleText = 'Adding text in here should update state and char counter accordingly'
    textarea.value = sampleText
    textarea.dispatchEvent(new Event('keyup'))
    await submitButton.click()
    expect(document.getElementById('entry-thank-you-message').innerHTML).toBe('Your feedback has been recorded.')
  })
})
