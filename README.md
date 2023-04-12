# Password Generator

## Purpose

Build a password generator capable of deriving strong, reproducible passwords from easy to remember hints.

## Rationale

One way to securely store and share passwords is by using a password manager. It is a recommended and widely used solution, but not without problems.
See for example:

- [LastPass vault breach (2022-12-28)](https://www.theverge.com/2022/12/28/23529547/lastpass-vault-breach-disclosure-encryption-cybersecurity-rebuttal)

Proposed generator is an alternative approach with two main advantages:
(1) passwords are generated on demand and never stored -
there is no danger of data breach
(2) there is no master password to remember.

## Simple Example

The table below illustrates how from the same hint,
using easily customizable `pepper` and `salt` options
(here: `pepper` = '+', `salt` = 'salt')
completely unrelated passwords with different length are generated

| hint | length | generated password               |
| ---- | ------ | -------------------------------- |
| mos  | 8      | Xvyqf+0V                         |
| mos  | 16     | xdBl3qU6bZvZ+A4X                 |
| mos  | 32     | 1dtyBU1zuGBS+tPxrbZbppOqGrYaQJQH |

Note: `pepper` string (1 or more characters) is used to provide special
character typically required in passwords

## Similar solutions

1. https://passwordmaker.org (also [on Github](https://github.com/passwordmaker))
1. http://passwordgen.org (also [on GitHub](https://github.com/eterevsky/passwordgen))

## Check it out!

1. https://hpass.net
1. https://ryszard314159.github.io/template.html

## Useful tools

1. bootstrap - JavaScript module (npm install bootstrap)
1. [workbox](https://developer.chrome.com/docs/workbox/) - Production-ready service worker libraries and tooling
1. https://web.dev/progressive-web-apps/ -
1. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
1. https://jakearchibald.github.io/isserviceworkerready/
1. https://hnpwa.com/ - a lot of examples with code
1. https://www.pwabuilder.com

## TODO

- use secure web storage?
  - [stackoverlow](https://stackoverflow.com/questions/54039031/encrypting-and-decryption-local-storage-values)
  - https://nodejs.org/api/crypto.html
  - https://nodejs.org/api/webcrypto.html
- automate publishing to [pages.github.io](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#creating-a-custom-github-actions-workflow-to-publish-your-site)
- web browser plugin and PWA (progressive web app) -
  these probably can use [content scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
  to detect that pointer is in the password input box... some related Stackoverlow items:
  - [How to access the webpage DOM/HTML from an extension popup or background script?](https://stackoverflow.com/questions/4532236/how-to-access-the-webpage-dom-html-from-an-extension-popup-or-background-script)
  - [How to determine which html page element has focus?](https://stackoverflow.com/questions/483741/how-to-determine-which-html-page-element-has-focus)
- native smartphone apps (Android, iOS)
- [progressive web application](https://en.wikipedia.org/wiki/Progressive_web_app)
- add logo e.g. `icons/logo.png` generated with [DALL-E](https://openai.com/dall-e-2/)
- compile node js to byte-code
- run local server for testing e.g.: python -m http.server 8080
- https://web.dev/how-to-use-local-https/
- install local https server to facilitate pwa testing: https://github.com/FiloSottile/mkcert
- https://www.arubacloud.com/tutorial/how-to-enable-https-protocol-with-apache-2-on-ubuntu-20-04.aspx
- https://www.arubacloud.com/tutorial/how-to-create-a-self-signed-ssl-certificate-on-ubuntu-18-04.aspx

```
$ ./mkcert -install
Created a new local CA 💥
Sudo password:
The local CA is now installed in the system trust store! ⚡️
The local CA is now installed in the Firefox and/or Chrome/Chromium trust store (requires browser restart)! 🦊
```

Here are pointers to some resources:

1. [Chrome extensions samples](https://github.com/GoogleChrome/chrome-extensions-samples)
1. [How to make a Chrome browser extension from scratch | Understanding Chrome extension anatomy](https://medium.com/front-end-weekly/how-to-make-a-chrome-browser-extension-from-scratch-chrome-extension-development-basics-basic-ba1daee11123)
1. https://web.dev/progressive-web-apps/
1. https://simplepwa.com/
1. https://github.com/hemanth/awesome-pwa
1. https://github.com/mdn/pwa-examples
1. https://github.com/vaadin/expense-manager-demo
1. [PWA Series: Hands-on, create your first PWA, step by step
   ](https://medium.com/samsung-internet-dev/pwa-series-hands-on-create-your-first-pwa-step-by-step-5bb7a6605349)
1. [Hello-pwa](https://github.com/jamesjohnson280/hello-pwa)
1. https://web.dev/install-criteria/#criteria
1. https://www.freecodecamp.org/news/publish-your-website-netlify-github/
1. [Building & Deploying your first Progressive Web App](https://link.medium.com/eUnGrg6nCvb)
1. https://www.udemy.com/course/progressive-web-apps/learn/lecture/7171264

## Password generators

I could not find any password generators which would generate reproducible password given
a hint, and possibly some other parameters.

1. https://passgen.io/
1. https://passgen.co/
1. https://www.avast.com/en-us/random-password-generator
1. https://www.nexcess.net/web-tools/secure-password-generator/
1. https://www.dashlane.com/features/password-generator
1. https://www.grc.com/passwords.htm

## Password testers

1. https://www.security.org/how-secure-is-my-password/
1. https://www.passwordmonster.com

## JavaScript: Create reproducible UUIDs within a name space

This can be useful to hash user emails e.g.

```
const { v5: uuidv5 } = require('uuid');
const EMAIL_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
uuidv5('alice@gmail.com', EMAILS_NAMESPACE); // -> '28e0fb10-e6ba-5663-9eb4-54e0b9607643'
uuidv5('bob@gmail.com', EMAILS_NAMESPACE); // -> '5337ff34-e3d4-5234-bc8a-0baa84a4fb48'
```

This way we can check if user (i.e. email) is in the system without actually storing emails

## Password managers (bad) press

1. [Norton LifeLock Accounts Targeted (2023-01-19)](https://www.cnet.com/tech/services-and-software/norton-lifelock-accounts-targeted-what-to-know-and-how-to-protect-your-passwords/)
1. [Lastpass: Hackers stole customer vault data in cloud storage breach (2022-12-22)](https://www.bleepingcomputer.com/news/security/lastpass-hackers-stole-customer-vault-data-in-cloud-storage-breach/)

## Notes

- `document.querySelectorAll('input[type="password"]')` can be used to select input box (or boxes?) for password in the _active_ page (see [this](https://stackoverflow.com/questions/75238386/is-there-a-way-to-find-html-element-by-type/75238590#75238590) stackoverflow entry)
- [Element.getClientRects()](https://developer.mozilla.org/en-US/docs/Web/API/Element/getClientRects) - might be useful to get coords of input box,
  maybe also jQuery [.position()](https://api.jquery.com/position/)?
- [How to get access to DOM elements?](https://stackoverflow.com/questions/19758028/chrome-extension-get-dom-content) from popup? See also [Firefox version of chrome extensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities)
- [How to inspect source code of browser extension?](https://www.maketecheasier.com/view-source-code-chrome-extension/); go to:

  1. `chrome://extensions/` to get ID of the extension
     (e.g. ID=aeblfdkhhhdcdjpifhhbdiojplfjncoa for `1password`)
  1. `chrome://version/` to get Profile Path (e.g. `$HOME/.config/google-chrome/Default`)
  1. `$HOME/.config/google-chrome/Default/Extensions/<ID>` -
     this is where the source code is located
  1. use e.g. `https://www.freeformatter.com` to format JavaScript code

- [Build a Chrome Extension – Course for Beginners](https://www.youtube.com/watch?v=0n809nd4Zu4)
  1. illustrates how use chrome API to communicate between `content.js` script, which runs in the context of the page (and has access to DOM elements) and running in the background service workers.
  1. to create and add new elements to the elements in
     the page e.g. popup icon like `1password` popping up
     in the password input box! using `.appendChild()`
- [How to inject JavaScript?](https://www.freecodecamp.org/news/how-to-inject-javascript-code-to-manipulate-websites-automatically/)

## Attributions

1. [info icon](https://commons.wikimedia.org/wiki/File:Icons8_flat_info.svg)

## References

1. [NIST Password Guidelines and Best Practices for 2020](https://auth0.com/blog/dont-pass-on-the-new-nist-password-guidelines/)
1. [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
1. [8 chrome extensions](https://twitter.com/Prathkum/status/16301875113969336388)
1. [Episode 552: Matt Frisbie on Browser Extensions](https://www.se-radio.net/2023/02/episode-552-matt-frisbie-on-browser-extensions/)
1. [Android emulator](https://docs.waydro.id/usage/install-on-desktops)
1. [Comparing Browser-based Password Managers: Is There Any Difference?](https://locker.io/blog/browser-based-password-managers)
1. [WebDev Learn PWA](https://web.dev/learn/pwa/)
1. [PWA from scratch (freecodecamp)](https://www.freecodecamp.org/news/build-a-pwa-from-scratch-with-html-css-and-javascript)
1. [Simulate mobile devices with Device Mode](https://developer.chrome.com/docs/devtools/device-mode/)
1. [Web App manifest generator](https://app-manifest.firebaseapp.com/)
1. [PWABuilder](https://www.pwabuilder.com/)
1. [Progressive Web Apps: The Concise PWA Masterclass](https://www.udemy.com/course/progressive-web-apps/)
