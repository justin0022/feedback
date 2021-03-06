/* global describe, test, expect, Event, jest */
import controller from '../src/app'
import 'babel-polyfill'
import * as c from '../src/defaults'

jest.mock('../src/api')

const createInitialState = () => (
  {
    ...c.createDefaultState(),
    emojis: c.defaultEmojis,
    text: {
      introText: c.introText,
      feedbackTextPrompt: c.feedbackTextPrompt,
      feedbackThankYou: c.feedbackThankYou
    }
  }
)

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

  test('should throw error if caliper (third param) is not specified', () => {
    const app = controller()
    const expectedError = () => {
      app.init('entryId', {})
    }
    expect(expectedError).toThrowError('caliper must be specified')
  })

  test('should throw error if element with ID (entry point of app) does not exist', () => {
    const app = controller()
    const expectedError = () => {
      app.init('entry', {}, {})
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
    const caliper = {
      object: {
        'id': 'urn:uuid:42db09b6-98fc-4ea6-87f3-fd2f85b9b12a',
        'type': 'DigitalResource'
      },
      questionId: 'urn:uuid:450f0d09-4c87-414e-87d2-29df60ae3b39',
      scaleId: 'urn:uuid:450f0d09-4c87-414e-87d2-29df60ae3b39'
    }
    document.body.innerHTML = `<div id=${entrypoint}></div>`

    const app = controller()
    app.init(entrypoint, endpoints, caliper, {})

    const appState = app.getState()

    expect(appState).toEqual({
      ...createInitialState(),
      endpoints,
      caliper,
      entryId: entrypoint
    })
  })

  test('text config should work', () => {
    const entrypoint = 'myEntryId'
    const endpoints = {
      emoji: 'http://localhost:8080/emoji',
      feedback: 'http://localhost:8080/feedback',
      votes: 'http://localhost:8080/votes'
    }
    const caliper = {
      object: {
        'id': 'urn:uuid:42db09b6-98fc-4ea6-87f3-fd2f85b9b12a',
        'type': 'DigitalResource'
      },
      questionId: 'urn:uuid:450f0d09-4c87-414e-87d2-29df60ae3b39',
      scaleId: 'urn:uuid:450f0d09-4c87-414e-87d2-29df60ae3b39'
    }
    document.body.innerHTML = `<div id=${entrypoint}></div>`

    const app = controller()

    app.init(entrypoint, endpoints, caliper, {
      introText: 'Hello there!',
      feedbackTextPrompt: 'Please give us some feedback!',
      feedbackThankYou: 'Bye for now'
    })

    const appState = app.getState()

    expect(appState).toEqual({
      ...createInitialState(),
      endpoints,
      caliper,
      entryId: entrypoint,
      text: {
        introText: 'Hello there!',
        feedbackTextPrompt: 'Please give us some feedback!',
        feedbackThankYou: 'Bye for now'
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
    const caliper1 = {
      object: {
        'id': 'urn:uuid:42db09b6-98fc-4ea6-87f3-fd2f85b9b12a',
        'type': 'DigitalResource'
      },
      questionId: 'urn:uuid:450f0d09-4c87-414e-87d2-29df60ae3b39',
      scaleId: 'urn:uuid:450f0d09-4c87-414e-87d2-29df60ae3b39'
    }
    const caliper2 = {
      object: {
        'id': 'urn:uuid:7b342a5d-6048-4dd0-8507-facbad166685',
        'type': 'DigitalResource'
      },
      questionId: 'urn:uuid:ae810e74-cc52-4a4c-8763-f1f561a62bcc',
      scaleId: 'urn:uuid:6cb89528-925f-41f1-b1fc-0aa88636e857'
    }
    document.body.innerHTML = `<div id=${entrypoint1}></div><div id=${entrypoint2}></div>`

    const app1 = controller()
    const app2 = controller()
    const app1Text = {
      introText: 'Hello there!',
      feedbackTextPrompt: 'Please give us some feedback!',
      feedbackThankYou: 'Bye for now'
    }
    const app2Text = {
      introText: 'gerbdf',
      feedbackTextPrompt: '3qr34tgsgs',
      feedbackThankYou: 'fsdvcxvx'
    }
    const app2Emojis = [
      { emojicon: '💀', emotion: 'skull' },
      { emojicon: '👻', emotion: 'ghost' },
      { emojicon: '👽', emotion: 'alien' },
      { emojicon: '🤖', emotion: 'robot' },
      { emojicon: '💩', emotion: 'pile of poo' }
    ]
    app1.init(entrypoint1, endpoints1, caliper1, { ...app1Text })
    app2.init(entrypoint2, endpoints2, caliper2, { ...app2Text, emojis: app2Emojis })

    const app1ExpectedState = {
      ...createInitialState(),
      entryId: entrypoint1,
      endpoints: endpoints1,
      caliper: caliper1,
      text: app1Text
    }

    const app2ExpectedState = {
      ...createInitialState(),
      endpoints: endpoints2,
      caliper: caliper2,
      entryId: entrypoint2,
      text: app2Text,
      emojis: app2Emojis
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
  const caliper = {
    object: {
      'id': 'urn:uuid:42db09b6-98fc-4ea6-87f3-fd2f85b9b12a',
      'type': 'DigitalResource'
    },
    questionId: 'urn:uuid:450f0d09-4c87-414e-87d2-29df60ae3b39',
    scaleId: 'urn:uuid:450f0d09-4c87-414e-87d2-29df60ae3b39'
  }
  const setupButton = () => {
    document.body.innerHTML = `<div id=${entrypoint}></div>`
    app.init(entrypoint, endpoints, caliper, { emojis: c.defaultEmojis })
    const sanitizedEmotion = c.defaultEmojis[0].emotion.replace(/\s+/g, '-')
    const emojiButtonId1 = document.getElementById(`${entrypoint}-${sanitizedEmotion}`)
    return emojiButtonId1
  }
  test('clicking an emoji updates the state correctly', () => {
    setupButton().click()
    const sanitizedEmotion = c.defaultEmojis[0].emotion.replace(/\s+/g, '-')
    const expectedState = {
      ...createInitialState(),
      responses: {
        selectedEmojis: [{ emojiId: `${entrypoint}-${sanitizedEmotion}`, emojicon: c.defaultEmojis[0].emojicon, emotion: c.defaultEmojis[0].emotion }],
        writtenFeedback: ''
      },
      endpoints: endpoints,
      caliper: caliper,
      entryId: entrypoint
    }
    expect(app.getState()).toEqual(expectedState)
  })
  test('clicking the same emoji again removes it from selectedEmojis', () => {
    setupButton().click()
    const expectedState = {
      ...createInitialState(),
      endpoints: endpoints,
      caliper: caliper,
      entryId: entrypoint
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
  const caliper = {
    object: {
      'id': 'urn:uuid:42db09b6-98fc-4ea6-87f3-fd2f85b9b12a',
      'type': 'DigitalResource'
    },
    questionId: 'urn:uuid:450f0d09-4c87-414e-87d2-29df60ae3b39',
    scaleId: 'urn:uuid:450f0d09-4c87-414e-87d2-29df60ae3b39'
  }

  test('when textarea is filled out, the application state changes accordingly as well as char counter', () => {
    const app = controller()
    document.body.innerHTML = `<div id=${entrypoint}></div>`
    app.init(entrypoint, endpoints, caliper, { emojis: c.defaultEmojis })
    const sanitizedEmotion = c.defaultEmojis[0].emotion.replace(/\s+/g, '-')
    const emojiButtonId1 = document.getElementById(`${entrypoint}-${sanitizedEmotion}`)
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
    app.init(entrypoint, endpoints, caliper)
    const sanitizedEmotion = c.defaultEmojis[0].emotion.replace(/\s+/g, '-')
    const emojiButtonId1 = document.getElementById(`${entrypoint}-${sanitizedEmotion}`)
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
    app.init(entrypoint, endpoints, caliper)
    const sanitizedEmotion = c.defaultEmojis[0].emotion.replace(/\s+/g, '-')
    const emojiButtonId1 = document.getElementById(`${entrypoint}-${sanitizedEmotion}`)
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
