# Personal Website Live on the FlyRank Domain

**Why it matters:**
A personal website is the one profile no platform can take away, and shipping it teaches you hosting, HTTPS, and DNS, infrastructure basics every track benefits from. You build it now on a free host, with a public URL you can send to anyone today. At the end of the track, once your capstone is approved, it moves onto a FlyRank subdomain. That is what marks you as someone who finished this program rather than someone who signed up for it.

**Brief:**
1. Plan a simple site: who you are, what you are building, links to your LinkedIn, GitHub, CV, and booking link, and a space for future posts and capstone work. One page is enough to start.
2. Build it on a free hosting path. Netlify is the recommended default: Netlify supports this internship program, the free tier covers everything you will do here, HTTPS is automatic, and it accepts a custom domain later without you rebuilding anything. GitHub Pages (pairs with PF-05), Cloudflare Pages, and Vercel's free hobby tier are all accepted too. Hand-written HTML, a static site generator, or an AI-assisted build are all fine; you must understand every file you deploy.
3. Get it live over HTTPS on your host's free URL, then rename the site to something you would put on a CV: yourname.netlify.app, not spontaneous-kitten-3f21.netlify.app. On Netlify that is Site configuration, then Change site name. This URL is the deliverable for this assignment.
4. Write your DNS walkthrough: what a CNAME record is, what value yours will hold, and what actually happens between someone typing your address and your host answering (resolver, nameserver, record, response). Explain it so a non-technical member of the team could follow it. You are writing it before you need it on purpose: when your subdomain is provisioned, this walkthrough is the checklist you run.
5. Link the site from your LinkedIn profile and CV. Use the free URL for now; you swap it for the subdomain later and both keep working.

**Your FlyRank subdomain:**
Subdomains are provisioned at the end of the track, once your capstone is approved, so there is nothing to request now. When yours is granted, Ops creates the DNS record for yourname.flyrank.ai and you do the other half: add the custom domain in your host's settings, point it at your site, wait for it to propagate, and confirm the padlock. That half is reviewed with your capstone, using the walkthrough you wrote in step 4. Nothing about your build changes when the day comes; a custom domain is a pointer, not a migration.

**Deliverable:**
The live HTTPS URL on your host's free domain, plus your DNS walkthrough (half a page to a page, in your own words). Both go in the internship portal on this assignment's card: the URL under Deliverable links, the walkthrough as a link or an attached file.

**Pass / revise:**
- Site live and loading over HTTPS on a clean, public URL, tested logged out in a private window
- Contains your positioning, working links to LinkedIn, GitHub, CV, and booking link
- DNS walkthrough technically correct and clearly your own words
- You can explain every file in the deployed site
- Site linked from LinkedIn and CV
- At capstone: subdomain added in your host, pointed correctly, and serving over HTTPS

**Linked resources:**
Netlify, the recommended path:

- [Deploy on Netlify (FlyRank intern guide)(opens in a new tab):](https://aifluency.flyrank.ai/netlify.html?_gl=1*g46th0*_gcl_au*NTQ5MzcyNzg2LjE3ODA3MDA3MDkuMTU5MDYxMDEzNS4xNzg2MTAwNDI3LjE3ODYxMDA0MjYuMjA3Mjc5MzAyMS4xNzg2MTAwNDI3LjE3ODYxMDA0MjY.) our own page, folder on your laptop to live URL in about two minutes, plus renaming, Git deploys, custom domains, forms, and the errors everyone hits the first time. Start here.
- [Netlify Drop(opens in a new tab):](https://app.netlify.com/drop) drag a folder onto the page and get a live HTTPS URL. The fastest possible proof that hosting is not the hard part.
- [Get started with Netlify (Netlify Docs)(opens in a new tab):](https://docs.netlify.com/start/choose-your-path/) the official version of the same path, including deploying straight from a Git repo so every push republishes.
- [Custom domains (Netlify Docs)(opens in a new tab):](https://docs.netlify.com/manage/domains/get-started-with-domains/) exactly what you will do when your subdomain lands. Read it now, use it at capstone.
- [HTTPS and SSL certificates (Netlify Docs)(opens in a new tab):](https://docs.netlify.com/manage/domains/secure-domains-with-https/https-ssl/) how the padlock appears on its own, and what to do on the rare occasion it does not.
- [Domain troubleshooting (Netlify Docs)(opens in a new tab):](https://docs.netlify.com/manage/domains/troubleshooting-tips/) open this before asking why your domain is not resolving yet.
- [Netlify Forms setup (Netlify Docs)(opens in a new tab):](https://docs.netlify.com/manage/forms/setup/) optional, a working contact form with no server behind it.

DNS, understand it before you write about it:

- [What is DNS? (Cloudflare Learning)(opens in a new tab):](https://www.cloudflare.com/learning/dns/what-is-dns/) the plainest explanation of resolvers, nameservers, and records. Read it before writing your walkthrough.
- [What is a CNAME record? (Cloudflare Learning)(opens in a new tab):](https://www.cloudflare.com/learning/dns/dns-records/dns-cname-record/) the one record type your walkthrough has to get right.

Other accepted hosting paths:

- [Quickstart for GitHub Pages (GitHub Docs)(opens in a new tab):](https://docs.github.com/en/pages/quickstart) a live site from an empty repository in under an hour, no command line needed. Pairs with PF-05.
- [Configuring a custom domain for your GitHub Pages site (GitHub Docs)(opens in a new tab):](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) the Pages equivalent of the Netlify custom domain doc, for capstone time.
- [Cloudflare Pages getting started (Cloudflare Docs)(opens in a new tab):](https://developers.cloudflare.com/pages/get-started/) the third accepted path, closest to the DNS reading above.
- [Getting started with Vercel (Vercel Docs)(opens in a new tab):](https://vercel.com/docs/getting-started-with-vercel) the fourth, if you are already living in that ecosystem.