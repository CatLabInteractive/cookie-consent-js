/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cookie-consent-js
 * License: MIT, see file 'LICENSE'
 */

function CookieConsent(props) {

    var self = this
    this.props = {
        buttonPrimaryClass: "btn btn-primary", // the "accept all" buttons class, only used for styling
        buttonSecondaryClass: "btn btn-secondary", // the "accept necessary" buttons class, only used for styling
        privacyPolicyUrl: "privacy-policy.html",
        autoShowModal: true, // disable autoShowModal on the privacy policy page, to make that page readable
        lang: navigator.language, // the language, in which the modal is shown
        blockAccess: false, // set "true" to block the access to the website before choosing a cookie configuration
        position: "right", // position ("left" or "right"), if blockAccess is false
        postSelectionCallback: undefined, // callback, after the user has made his selection
        content: { // the content in all needed languages
            de: {
                title: "Cookie-Einstellungen",
                body: "Wir nutzen Cookies, um Inhalte zu personalisieren und die Zugriffe auf unsere Website zu analysieren. " +
                    "Sie können wählen, ob Sie nur für die Funktion der Website notwendige Cookies akzeptieren oder auch " +
                    "Tracking-Cookies zulassen möchten. Weitere Informationen finden Sie in unserer --privacy-policy--.",
                privacyPolicy: "Datenschutzerklärung",
                buttonAcceptAll: "Alle Cookies akzeptieren",
                buttonAcceptTechnical: "Nur technisch notwendige Cookies akzeptieren"
            },
            en: {
                title: "Cookie settings",
                body: "We use cookies to personalize content and analyze access to our website. " +
                    "You can choose whether you only accept cookies that are necessary for the functioning of the website " +
                    "or whether you also want to allow tracking cookies. For more information, please refer to our --privacy-policy--.",
                privacyPolicy: "privacy policy",
                buttonAcceptAll: "Accept all cookies",
                buttonAcceptTechnical: "Only accept technically necessary cookies"
            }
        },
        cookieName: "cookie-consent-tracking-allowed",  // the name of the cookie, the cookie is `true` if tracking was accepted
        modalId: "cookieConsentModal", // the id of the modal dialog element
        crossDomainQueryParameterName: "_cc",
        crossDomainDomains: [],
        googleTagDataLayer: 'dataLayer'
    }
    for (var property in props) {
        // noinspection JSUnfilteredForInLoop
        this.props[property] = props[property]
    }
    this.lang = this.props.lang
    if (this.lang.indexOf("-") !== -1) {
        this.lang = this.lang.split("-")[0]
    }
    if (this.props.content[this.lang] === undefined) {
        this.lang = "en" // fallback
    }
    var _t = this.props.content[this.lang]
    var linkPrivacyPolicy = '<a href="' + this.props.privacyPolicyUrl + '">' + _t.privacyPolicy + '</a>'
    var modalClass = "cookie-consent-modal"
    if (this.props.blockAccess) {
        modalClass += " block-access"
    }
    this.modalContent = '<div class="' + modalClass + '">' +
        '<div class="modal-content-wrap ' + this.props.position + '">' +
        '<div class="modal-content">' +
        '<div class="modal-header">--header--</div>' +
        '<div class="modal-body">--body--</div>' +
        '<div class="modal-footer">--footer--</div>' +
        '</div></div>'
    this.modalContent = this.modalContent.replace(/--header--/, "<h3 class=\"modal-title\">" + _t.title + "</h3>")
    this.modalContent = this.modalContent.replace(/--body--/,
        _t.body.replace(/--privacy-policy--/, linkPrivacyPolicy)
    )
    this.modalContent = this.modalContent.replace(/--footer--/,
        "<div class='buttons'>" +
        "<button class='btn-accept-necessary " + this.props.buttonSecondaryClass + "'>" + _t.buttonAcceptTechnical + "</button>" +
        "<button class='btn-accept-all " + this.props.buttonPrimaryClass + "'>" + _t.buttonAcceptAll + "</button>" +
        "</div>"
    )

    /**
     *
     */
    this.addToDataLayer = function(obj) {
        if (!this.props.googleTagDataLayer) {
            return;
        }

        if (typeof(window[this.props.googleTagDataLayer]) === 'undefined') {
            window[this.props.googleTagDataLayer] = [];
        }

        if (arguments.length > 1) {
            window[this.props.googleTagDataLayer].push(arguments);
        } else {
            window[this.props.googleTagDataLayer].push(arguments[0]);
        }

    }

    function setCookie(name, value, days) {
        var expires = ""
        if (days) {
            var date = new Date()
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
            expires = "; expires=" + date.toUTCString()
        }
        document.cookie = name + "=" + (value || "") + expires + "; Path=/; SameSite=Strict;"
    }

    function getCookie(name) {
        var nameEQ = name + "="
        var ca = document.cookie.split(';')
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i]
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length)
            }
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length)
            }
        }
        return undefined
    }

    function removeCookie(name) {
        document.cookie = name + '=; Path=/; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    }

    function documentReady(fn) {
        if (document.readyState !== 'loading') {
            fn()
        } else {
            document.addEventListener('DOMContentLoaded', fn)
        }
    }

    function hideDialog() {
        this.modal.style.display = "none"
    }

    function showDialog() {
        documentReady(function () {
            this.modal = document.getElementById(self.props.modalId)
            if (!this.modal) {
                this.modal = document.createElement("div")
                this.modal.style.position = 'absolute';
                this.modal.style.zIndex = 1000;
                this.modal.id = self.props.modalId
                this.modal.innerHTML = self.modalContent
                document.body.append(this.modal)
                this.modal.querySelector(".btn-accept-necessary").addEventListener("click", function () {
                    self.decline();
                    hideDialog()
                    if(self.props.postSelectionCallback) {
                        self.props.postSelectionCallback()
                    }
                })
                this.modal.querySelector(".btn-accept-all").addEventListener("click", function () {
                    self.accept();
                    hideDialog()
                    if(self.props.postSelectionCallback) {
                        self.props.postSelectionCallback()
                    }
                })
            } else {
                this.modal.style.display = "block"
            }
        }.bind(this))
    }

    function getRefQueryParam(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    function isTargetWebsite(link) {
        // is internal link?
        if (!link.host || link.host === window.location.host) {
            return false;
        }

        var href = link.href;
        for (var i = 0; i < self.props.crossDomainDomains.length; i ++) {
            if (("" + href).indexOf(self.props.crossDomainDomains[i]) > -1) {
                return true;
            }
        }
        return false;
    }

    function listenForLinkClicks() {
        // Listen for link clicks
        var navLinks = document.querySelectorAll('a');
        navLinks.forEach(function (item) {
            if (item.dataset.ccFixed) {
                return;
            }
            item.dataset.ccFixed = true;
            item.addEventListener('click', function () {
                var consentStatus = getCookie(self.props.cookieName);
                if (!consentStatus) {
                    return;
                }

                if (!isTargetWebsite(item)) {
                    return false;
                }

                if (item.href.indexOf('?') === -1) {
                    item.href += '?';
                } else {
                    item.href += '&';
                }
                item.href += self.props.crossDomainQueryParameterName + '=' + consentStatus;
            });
        });
    }

    var showDialogOnLoad = false;
    if (getCookie(this.props.cookieName) === undefined && this.props.autoShowModal) {
        showDialogOnLoad = true;
    } else {
        switch (getCookie(this.props.cookieName)) {
            case 'true':
                this.addToDataLayer('consent', 'default', {
                    'ad_storage': 'granted',
                    'analytics_storage': 'granted'
                });
                this.addToDataLayer({ "cookie_consent" : 2 });
                break;

            case 'false':
                this.addToDataLayer('consent', 'default', {
                    'ad_storage': 'denied',
                    'analytics_storage': 'denied'
                });
                this.addToDataLayer({ "cookie_consent" : 0 });
                break;
        }
        this.addToDataLayer({ event: "cookie_consent" });
    }

    // Wait one second for the cross domain feature to kick in.
    documentReady(function() {

        setTimeout(function() {
            if (showDialogOnLoad) {
                showDialog()
            }
        }, 1);
    });

    // API
    this.reset = function () {
        removeCookie(this.props.cookieName);
        showDialog()
    }

    this.accept = function() {
        setCookie(self.props.cookieName, "true", 365);

        this.addToDataLayer('consent', 'update', {
            'ad_storage': 'granted',
            'analytics_storage': 'granted'
        });
        this.addToDataLayer({ "cookie_consent" : 2 });
        this.addToDataLayer({ event: "cookie_consent", value: 2 });
    }

    this.decline = function() {
        setCookie(self.props.cookieName, "false", 365);

        this.addToDataLayer('consent', 'update', {
            'ad_storage': 'denied',
            'analytics_storage': 'denied'
        });
        this.addToDataLayer({ "cookie_consent" : 0 });
        this.addToDataLayer({ event: "cookie_consent", value: 0 });
        this.addToDataLayer({ event: "revoke_cookie_consent", value: 0 });
    };

    this.enableCrossDomain = function(domains) {
        if (!Array.isArray(domains)) {
            domains = [ domains ];
        }

        this.props.crossDomainDomains = domains;

        documentReady(function() {
            // Look for query parameters
            var crossDomainValue = getRefQueryParam(self.props.crossDomainQueryParameterName);
            if (crossDomainValue) {
                switch (crossDomainValue) {
                    case 'true':
                        showDialogOnLoad = false;
                        this.accept();
                        break;

                    case 'false':
                        showDialogOnLoad = false;
                        this.decline();
                        break;
                }

                // try to remove the parameter
                try {
                    let newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                    var queryString = window.location.search;
                    queryString = queryString.replace(self.props.crossDomainQueryParameterName + '=' + crossDomainValue, '');
                    if (queryString) {
                        newUrl += queryString;
                    }
                    window.history.pushState({path: newUrl}, '', newUrl);
                } catch (e) {
                    // do nothing.
                }
            }

            // Listen for link clicks
            setInterval(listenForLinkClicks, 1000);
            listenForLinkClicks();

        }.bind(this));
    };

    this.trackingAllowed = function () {
        return getCookie(this.props.cookieName) === "true"
    }

}
