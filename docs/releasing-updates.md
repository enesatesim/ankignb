# Releasing an Update to the Chrome Web Store

> **Summary:** This is the step-by-step checklist for shipping a new version of AnkiGNB to an existing Chrome Web Store item: bump the version in every place it lives, type-check, zip, test the exact build, upload it to the **same** store item, and update the listing and docs if needed. For background on versioning and the privacy policy, see [Build & Release](build-and-release.md).

Work through the steps in order. Each one starts with a checkbox so you can copy the list into an issue or PR.

---

## 0. Before you start

- [ ] All code changes for this release are merged into `main`, and your working tree is clean (`git status`).
- [ ] Check the dashboard: if a previous submission is still **Pending review**, you can't submit another one. Either wait for it, or open the item and use **Cancel review** first. Cancelling puts you back in the queue from the start.
- [ ] Decide whether this release changes any of these, because they need extra work below:
  - **Permissions or host permissions** in `wxt.config.ts` (step 6)
  - **Data handling**: any network call, analytics or storage (step 7)
  - **Listing text or screenshots** (step 8)

## 1. Pick the new version number

The Chrome Web Store rejects a package whose version is not **strictly higher** than the one already published. A version is one to four dot-separated integers (for example `1.4` or `1.4.1`).

- Bug fix only: bump the last number (`1.3` → `1.3.1`).
- New feature or a fix for a Gemini Notebook redesign: bump the minor number (`1.3` → `1.4`).

## 2. Bump the version everywhere

The version is hard-coded in four places. Update all of them to the same number:

| File | What to change |
|---|---|
| [`wxt.config.ts`](../wxt.config.ts) | `version: '1.4'`. This is what ends up in the shipped manifest |
| [`src/components/Popup.tsx`](../src/components/Popup.tsx) | The `.popup-version` text, for example `v1.4` |
| [`package.json`](../package.json) | `"version": "1.4.0"`. It sets the zip filename. Run `npm install` afterwards so `package-lock.json` matches |
| [`README.md`](../README.md) | Add a new `## **v1.4 Changelog**` section above the previous one |

Also update the version mentioned in [docs/README.md](README.md) (Quick facts) and in [Build & Release](build-and-release.md#version-bump-checklist).

To check that nothing was missed, search for the **old** version (here `1.3`). The only remaining hit should be the old changelog heading in `README.md`:

```bash
git grep -n "1\.3" -- wxt.config.ts package.json src README.md
```

## 3. Type-check and build the zip

```bash
npm run compile
```

```bash
npm run zip
```

The build does not type-check, so don't skip `compile`. The zip is written to `.output/ankignb-<version>-chrome.zip`, for example `.output/ankignb-1.4.0-chrome.zip`.

## 4. Test the exact build you are about to upload

1. Open `chrome://extensions` and turn on **Developer mode**.
2. **Remove or disable** the store-installed AnkiGNB, so you are only running one copy.
3. Click **Load unpacked** and pick `.output/chrome-mv3/`.
4. Check that the popup shows the new version.
5. On [notebook.google.com](https://notebook.google.com), open a **Flashcards** artifact and a **Quiz** artifact. On each one, check that:
   - the **Copy**, **Download** and **Support** buttons appear in the footer,
   - **Copy** puts tab-separated Front/Back text on the clipboard,
   - **Download** saves a `.csv` named after the notebook and artifact, and it imports into Anki,
   - the buttons survive resizing the window and re-opening the artifact.
6. Open the DevTools console on the Gemini Notebook tab and check there are no new errors from the extension.

If something is broken because Google changed the page, see [Gemini Notebook DOM Contract](gemini-notebook-dom-contract.md).

## 5. Upload the new package

1. Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) and click the **AnkiGNB** item. Use the existing item. Don't create a new one, because that would be a separate listing with no users.
2. Go to the **Package** tab and click **Upload new package**.
3. Choose `.output/ankignb-<version>-chrome.zip`.
4. Check that the dashboard shows the new version number. If it complains that the version must be higher, go back to step 2.

## 6. If permissions changed: update the justifications

Only needed if `permissions` or `host_permissions` in `wxt.config.ts` changed.

- Go to the **Privacy** tab and add or update the justification for every new permission. Remove justifications for permissions you dropped.
- Update the permission table in [Browser Support](browser-support.md#chrome-mv3).
- **Be careful:** if the new permission shows a new warning to users, Chrome **disables the extension for existing users** until they accept it. Many people never do. Avoid adding permissions unless the feature really needs them.
- New or broader host permissions (especially wildcards) can trigger an in-depth review, which takes longer.

## 7. If data handling changed: update the privacy disclosures

Only needed if the release adds a network call, analytics, `storage`, or anything else that touches user data.

- Update [`PRIVACY_POLICY.md`](../PRIVACY_POLICY.md) and push it to `main`. The store links to the copy on GitHub.
- On the **Privacy** tab, update the **Data usage** checkboxes so they match.
- The listing, the privacy policy and the extension's actual behavior must all agree. A mismatch is a common reason for rejection.

## 8. If the listing needs changes

On the **Store listing** tab, update the description, screenshots or promo tile if the UI or features changed. Listing changes go through review too, even when there is no new package.

## 9. Submit for review

1. Click **Save draft**, then **Submit for review**.
2. In the submit dialog, choose how to publish:
   - **Publish automatically after review** (the default). Fine for normal updates.
   - **Defer publishing**. The update waits after approval until you click **Publish**. Use this if you want to publish at a specific time. You have 30 days before the approval expires.
3. Reviews usually take from a few hours to a few days. You get an email when the status changes. Watch the item's **Status** in the dashboard.

## 10. If the review is rejected

- The rejection email names the policy and usually the reason (for example a missing permission justification, or a listing that doesn't match the behavior).
- Fix the problem. If the code changes, bump the version again (step 2) and rebuild, then upload and resubmit.
- If you think the rejection is wrong, use the appeal link in the email.

## 11. After it is published

- [ ] Tag the release in git and push the tag:

  ```bash
  git tag v1.4
  ```

  ```bash
  git push origin v1.4
  ```

- [ ] Optionally create a GitHub release from the tag and attach the zip.
- [ ] Chrome updates installed copies automatically, usually within a few hours. To check right away, open `chrome://extensions`, turn on **Developer mode**, and click **Update**.
- [ ] If the update caused a problem: the store has **no rollback button**. Revert the change in git, bump to a **higher** version (for example `1.4.1`), and release that following this same guide.

---

## Emergency fix: Gemini Notebook changed and the buttons disappeared

This is the most likely reason you'll need an urgent release. The fast path is:

1. Find what changed using [Gemini Notebook DOM Contract](gemini-notebook-dom-contract.md) and [Known Issues](known-issues.md).
2. Fix it, then run `npm run compile`.
3. Bump the patch version (for example `1.4` → `1.4.1`) in all four places (step 2).
4. Run `npm run zip`, test the unpacked build (step 4), upload it (step 5), and submit it (step 9).

Steps 6 to 8 usually don't apply to a selector fix.

---

**Related pages:** [Build & Release](build-and-release.md) · [Browser Support](browser-support.md) · [Gemini Notebook DOM Contract](gemini-notebook-dom-contract.md)
