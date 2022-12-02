# Password Generator

## Purpose

Build a password generator capable of deriving strong, random (and reproducible!) passwords from easy to remember hints.

## Rationale

One way to securely store and share passwords is by using a password manager.
It is a recommended and widely used solution, but not without problems.
Proposed generator is an alternative approach with two main advantages:
(1) passwords are generated on demand and never stored - there is no danger of data breach
(2) there is no master password to remember.
Large number of sites and apps offer strong random password generation,
but despite some (not exhaustive!) search (see some links below)
I was not able to locate any which would allow to generate reproducible, hint-based passwords.

## Simple Example

The table below illustrates how from the same hint, using easily customizable options,
passwords with length defined length, etc.

| hint | generated password |
| -----|------------------- |
| mos  | JF8zuf?7 |
| mos  | 0K4jTgOsdfA7c@yW |
| mos  | nKxeTUvhXgNaN>qS6CUZmz8uSRocjbpA |

## TODO

* web browser plugin
* native smartphone apps (Android, iOS)
* [progressive web application](https://en.wikipedia.org/wiki/Progressive_web_app)
* add logo e.g. ``icons/logo.png`` generated with [DALL-E](https://openai.com/dall-e-2/)

Here are pointers to some resources:

1. [Chrome extensions samples](https://github.com/GoogleChrome/chrome-extensions-samples)
1. [How to make a Chrome browser extension from scratch | Understanding Chrome extension anatomy](https://medium.com/front-end-weekly/how-to-make-a-chrome-browser-extension-from-scratch-chrome-extension-development-basics-basic-ba1daee11123)
1. https://web.dev/progressive-web-apps/
1. https://simplepwa.com/
1. https://github.com/hemanth/awesome-pwa
1. https://github.com/mdn/pwa-examples
1. https://github.com/vaadin/expense-manager-demo


## Password generators

I could not find any password generators which would generate reproducible password given
a hint, and possibly some other parameters.

1. https://passgen.io/
1. https://passgen.co/
1. https://www.avast.com/en-us/random-password-generator
1. https://www.nexcess.net/web-tools/secure-password-generator/
1. https://www.dashlane.com/features/password-generator
1. https://www.grc.com/passwords.htm

