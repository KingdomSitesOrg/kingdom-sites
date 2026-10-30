# Preview share link: preview.kingdom-sites.com

`preview.kingdom-sites.com` is a permanent link to the latest preview build of the site. It is not production, and its pages say `noindex`, so search engines keep them out.

After every preview deploy, point the link at the new build with one command:

```
vercel alias set <new-deployment-url> preview.kingdom-sites.com --scope team_zxAz0y61xNaSyJWv9WrAWSWr
```

The deploy itself is `vercel deploy --yes --scope team_zxAz0y61xNaSyJWv9WrAWSWr`. Never add `--prod`, and never promote a deployment.

The DNS record for this subdomain lives at kingdom-sites.com's DNS host (its nameservers are at GoDaddy, `domaincontrol.com`), not on Vercel. It must be `preview` as a CNAME to `cname.vercel-dns.com`. Until that record exists, the alias fails with "Response Error" while Vercel issues the certificate.
