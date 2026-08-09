# DNS Walkthrough — Muhamad Jamaludin

**Site:** https://muhamadjamaludin.vercel.app (Vercel, free tier)
**Future subdomain:** muhamadjamaludin.flyrank.ai
**CNAME value to be used:** `muhamadjamaludin.vercel.app`

---

## 1. What a CNAME record is

A CNAME (Canonical Name) record is one of the record types in DNS. It works
like an alias: it tells DNS that one name (hostname) should point to another
name.

For my case:

```
muhamadjamaludin.flyrank.ai  →  muhamadjamaludin.vercel.app
```

This means someone typing my subdomain still reaches the same site, without
needing to know that the site actually lives on Vercel. A CNAME does not
contain an IP address — it contains a target name. That is why it is a good
fit for services like Vercel whose server addresses can change without
affecting visitors.

## 2. What my CNAME value will be

When the subdomain is set up later, the record created on the FlyRank
side will be:

| Field | Value |
|-------|-------|
| Type | CNAME |
| Name | `muhamadjamaludin` |
| Target / Value | `muhamadjamaludin.vercel.app` |

On my side: I add the custom domain `muhamadjamaludin.flyrank.ai` in
Vercel → project `muhamadjamaludin` → Settings → Domains, then wait for
DNS propagation until the record is read.

## 3. What happens when someone types my address

The flow, explained for a non-technical reader:

1. **Typing the address.** Someone types `muhamadjamaludin.flyrank.ai`
   in a browser.

2. **The resolver asks (the receptionist).** The browser asks the DNS
   resolver — a kind of receptionist whose job is to find out where an
   address points. The resolver is usually operated by the ISP or another
   internet provider, and it works in the background, unnoticed by the user.

3. **The nameserver answers (the central archive).** The resolver does not
   memorise every name in the world, so it asks the authoritative
   nameserver for the domain `flyrank.ai` — the central archive holding
   that domain's DNS records. The nameserver checks and finds the CNAME
   record: "this name points to `muhamadjamaludin.vercel.app`".

4. **The record comes back (the archive's answer).** The resolver gets that
   answer — this is the "record" — and follows it up by finding where
   `muhamadjamaludin.vercel.app` is (the IP address of Vercel's server),
   also via DNS.

5. **The response (the host answers).** The request arrives at the right
   Vercel server. The server sends the site's page back to the browser,
   the browser displays it, and the HTTPS padlock appears — Vercel
   automatically provisions a certificate for any domain attached.

In short: **type → resolver → nameserver → record → host → page loads.**
The whole process takes under a second and is invisible to the user.

## 4. Checklist when the subdomain is provisioned (capstone)

1. Operations creates the CNAME record `muhamadjamaludin` →
   `muhamadjamaludin.vercel.app` on the `flyrank.ai` DNS side.
2. I add the custom domain `muhamadjamaludin.flyrank.ai` in Vercel →
   project `muhamadjamaludin` → Settings → Domains.
3. Wait for DNS propagation (usually minutes to a few hours).
4. Check the subdomain in a private window and confirm the HTTPS padlock.
5. Nothing changes on the website itself — a custom domain is only a
   pointer; the site is built and deployed exactly the same way.
