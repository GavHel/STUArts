"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import styles from "../experience.module.css";

const steps = ["Artwork details", "Dimensions & scale", "Inspiration", "Timeline"];

const mediums = [
  { icon: "▧", title: "Painting", detail: "Oil, acrylic, watercolor", base: 250 },
  { icon: "◉", title: "Ceramics", detail: "Functional or sculptural", base: 180 },
  { icon: "✳", title: "Mixed media", detail: "A little bit of everything", base: 225 },
  { icon: "▱", title: "Printmaking", detail: "Originals and editions", base: 120 },
];

const placements = ["Living space", "Office or studio", "A thoughtful gift", "Somewhere else"];
const placementIcons = ["⌂", "▦", "✳", "＋"];

type CommissionForm = {
  medium: string;
  placement: string;
  brief: string;
  width: string;
  height: string;
  units: "inches" | "centimeters";
  scale: string;
  inspiration: string;
  delivery: string;
  name: string;
  email: string;
};

const initialForm: CommissionForm = {
  medium: "Painting",
  placement: "Living space",
  brief: "",
  width: "",
  height: "",
  units: "inches",
  scale: "",
  inspiration: "",
  delivery: "",
  name: "",
  email: "",
};

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(amount);

export function CommissionBuilder() {
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedMedium = mediums.find((medium) => medium.title === form.medium) ?? mediums[0];
  const width = Number(form.width);
  const height = Number(form.height);
  const dimensionsProvided =
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0 &&
    width <= 200 &&
    height <= 200;
  const hasAnyDimension = form.width.trim() !== "" || form.height.trim() !== "";
  const area = dimensionsProvided
    ? width *
    height *
      (form.units === "centimeters" ? 0.155 : 1)
    : form.scale.startsWith("Small")
      ? 120
      : form.scale.startsWith("Large")
        ? 650
        : 300;
  const materials = Math.round(selectedMedium.base + area * 0.55);
  const artistFee = Math.round(selectedMedium.base * 0.75);
  const total = materials + artistFee;
  const studioTime = area > 500 ? "5—7 weeks" : area < 180 ? "2—3 weeks" : "3—4 weeks";

  function update<K extends keyof CommissionForm>(key: K, value: CommissionForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function validateStep(): boolean {
    if (step === 1) {
      if ((hasAnyDimension && !dimensionsProvided) || (!dimensionsProvided && !form.scale)) {
        setError("Enter both dimensions between 1 and 200, or choose a size guide to continue.");
        return false;
      }
    }
    if (step === 2 && form.inspiration.trim()) {
      try {
        const url = new URL(form.inspiration);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          throw new Error("Unsupported link protocol");
        }
      } catch {
        setError("Enter a complete web link beginning with https://, or leave it blank.");
        return false;
      }
    }
    if (step === 3) {
      if (!form.name.trim() || !form.email.trim()) {
        setError("Add your name and email so Maya can reply to your request.");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        setError("Enter a valid email address.");
        return false;
      }
    }
    setError("");
    return true;
  }

  function goNext() {
    if (validateStep()) setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function handleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < steps.length - 1) {
      goNext();
      return;
    }
    if (validateStep()) setReviewing(true);
  }

  async function submitRequest() {
    setIsSubmitting(true);
    setSubmissionError("");
    try {
      const response = await fetch("/api/commission-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medium: form.medium,
          placement: form.placement,
          brief: form.brief,
          width: dimensionsProvided ? width : null,
          height: dimensionsProvided ? height : null,
          units: form.units,
          scale: dimensionsProvided ? null : form.scale,
          inspiration: form.inspiration,
          delivery: form.delivery,
          name: form.name,
          email: form.email,
        }),
      });
      const result: unknown = await response.json();
      if (
        !response.ok ||
        typeof result !== "object" ||
        result === null ||
        !("ok" in result) ||
        result.ok !== true
      ) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "We could not save your request. Please try again.";
        throw new Error(message);
      }
      setSubmitted(true);
    } catch (caught) {
      setSubmissionError(
        caught instanceof Error
          ? caught.message
          : "We could not save your request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className={styles.steps} aria-label="Commission request steps">
        {steps.map((label, index) => (
          <button
            className={`${styles.step} ${step === index ? styles.stepActive : ""} ${index < step ? styles.stepComplete : ""}`}
            key={label}
            type="button"
            onClick={() => {
              if (index < step) {
                setStep(index);
                setReviewing(false);
                setError("");
              }
            }}
            aria-current={step === index ? "step" : undefined}
            disabled={index > step}
          >
            <span className={styles.stepNumber}>{index < step ? "✓" : index + 1}</span>
            {label}
          </button>
        ))}
      </div>

      <form
        className={`${styles.commissionGrid} ${reviewing ? styles.commissionReview : ""}`}
        onSubmit={handleReview}
        noValidate
      >
        {reviewing ? (
          <section className={styles.formCard}>
            <p className={styles.eyebrow}>ONE LAST LOOK</p>
            <h2 className={styles.reviewTitle}>Your commission request</h2>
            <p className={styles.reviewLead}>
              Check the details before submitting. Your estimate is a starting
              point, not a final quote.
            </p>
            <dl className={styles.reviewList}>
              <div><dt>Artwork</dt><dd>{form.medium}</dd></div>
              <div><dt>Placement</dt><dd>{form.placement}</dd></div>
              <div>
                <dt>Size</dt>
                <dd>
                  {dimensionsProvided
                    ? `${form.width} × ${form.height} ${form.units}`
                    : form.scale}
                </dd>
              </div>
              <div><dt>Estimated price</dt><dd>{formatPrice(total)} CAD</dd></div>
              <div><dt>Studio time</dt><dd>{studioTime}</dd></div>
              <div><dt>Contact</dt><dd>{form.name} · {form.email}</dd></div>
            </dl>
            {form.brief && (
              <div className={styles.reviewBrief}>
                <strong>Your idea</strong>
                <p>{form.brief}</p>
              </div>
            )}
            {submitted ? (
              <div className={styles.submissionSuccess} role="status">
                <strong>Your request has been saved.</strong>
                <p>
                  The request is in the database. Artist email notifications
                  aren&apos;t configured yet.
                </p>
              </div>
            ) : (
              <>
                <p className={styles.note}>
                  Your contact details will be stored with this request so the
                  artist can follow up when request management is available.
                </p>
                {submissionError && (
                  <p className={styles.formError} role="alert">{submissionError}</p>
                )}
                <div className={styles.formActions}>
                  <button
                    className={styles.outlineAction}
                    disabled={isSubmitting}
                    onClick={() => setReviewing(false)}
                    type="button"
                  >
                    ← Edit request
                  </button>
                  <button
                    className={styles.action}
                    disabled={isSubmitting}
                    onClick={submitRequest}
                    type="button"
                  >
                    {isSubmitting ? "Saving request…" : "Submit request"}
                    {!isSubmitting && <span aria-hidden="true">→</span>}
                  </button>
                </div>
              </>
            )}
          </section>
        ) : (
          <div className={styles.formStack}>
            {step === 0 && (
              <>
                <section className={styles.formCard}>
                  <div className={styles.formCardHeader}>
                    <div>
                      <h2>Artistic Medium &amp; Substrate</h2>
                      <p>What kind of work would you love to bring to life?</p>
                    </div>
                    <span className={styles.required}>REQUIRED</span>
                  </div>
                  <div className={styles.choiceGrid}>
                    {mediums.map((medium) => (
                      <button
                        aria-pressed={form.medium === medium.title}
                        className={`${styles.choice} ${form.medium === medium.title ? styles.choiceSelected : ""}`}
                        key={medium.title}
                        onClick={() => update("medium", medium.title)}
                        type="button"
                      >
                        <span className={styles.choiceIcon} aria-hidden="true">{medium.icon}</span>
                        <strong>{medium.title}</strong>
                        <small>{medium.detail}</small>
                      </button>
                    ))}
                  </div>
                </section>
                <section className={styles.formCard}>
                  <div className={styles.formCardHeader}>
                    <div>
                      <h2>Intended Artistic Placement</h2>
                      <p>Where will your new piece find its home?</p>
                    </div>
                  </div>
                  <div className={styles.choiceGrid}>
                    {placements.map((placement, index) => (
                      <button
                        aria-pressed={form.placement === placement}
                        className={`${styles.choice} ${form.placement === placement ? styles.choiceSelected : ""}`}
                        key={placement}
                        onClick={() => update("placement", placement)}
                        type="button"
                      >
                        <span className={styles.choiceIcon} aria-hidden="true">{placementIcons[index]}</span>
                        <strong>{placement}</strong>
                      </button>
                    ))}
                  </div>
                  <label className={styles.fieldLabel} htmlFor="brief">
                    A few words about your idea
                  </label>
                  <textarea
                    className={styles.textarea}
                    id="brief"
                    onChange={(event) => update("brief", event.target.value)}
                    placeholder="Colors, a feeling, a story, or anything else you'd like Maya to know..."
                    value={form.brief}
                  />
                </section>
              </>
            )}

            {step === 1 && (
              <section className={styles.formCard}>
                <div className={styles.formCardHeader}>
                  <div>
                    <h2>Dimensions &amp; Personal Scale Guide</h2>
                    <p>Share a size or choose a familiar reference.</p>
                  </div>
                  <span className={styles.required}>REQUIRED</span>
                </div>
                <div className={styles.dimensionGrid}>
                  <div>
                    <label className={styles.fieldLabel} htmlFor="width">Width</label>
                    <input
                      className={styles.field}
                      id="width"
                      max="200"
                      min="1"
                      onChange={(event) => update("width", event.target.value)}
                      placeholder="e.g. 18"
                      type="number"
                      value={form.width}
                    />
                  </div>
                  <div>
                    <label className={styles.fieldLabel} htmlFor="height">Height</label>
                    <input
                      className={styles.field}
                      id="height"
                      max="200"
                      min="1"
                      onChange={(event) => update("height", event.target.value)}
                      placeholder="e.g. 24"
                      type="number"
                      value={form.height}
                    />
                  </div>
                  <div>
                    <label className={styles.fieldLabel} htmlFor="units">Units</label>
                    <select
                      className={styles.select}
                      id="units"
                      onChange={(event) => update("units", event.target.value as CommissionForm["units"])}
                      value={form.units}
                    >
                      <option value="inches">Inches</option>
                      <option value="centimeters">Centimeters</option>
                    </select>
                  </div>
                </div>
                <label className={styles.fieldLabel} htmlFor="scale">Or select a scale</label>
                <select
                  className={styles.select}
                  id="scale"
                  onChange={(event) => update("scale", event.target.value)}
                  value={form.scale}
                >
                  <option value="">Choose a familiar size</option>
                  <option value="Small — fits on a bookshelf">Small — fits on a bookshelf</option>
                  <option value="Medium — about the size of a carry-on">Medium — about the size of a carry-on</option>
                  <option value="Large — makes a statement on the wall">Large — makes a statement on the wall</option>
                </select>
              </section>
            )}

            {step === 2 && (
              <section className={styles.formCard}>
                <div className={styles.formCardHeader}>
                  <div>
                    <h2>Visual Moodboard &amp; Inspirations</h2>
                    <p>Share a link that helps describe what you&apos;re imagining.</p>
                  </div>
                </div>
                <label className={styles.fieldLabel} htmlFor="inspiration">Inspiration link</label>
                <input
                  className={styles.field}
                  id="inspiration"
                  onChange={(event) => update("inspiration", event.target.value)}
                  placeholder="Paste a Pinterest, photo, or reference link"
                  type="url"
                  value={form.inspiration}
                />
                <label className={styles.fieldLabel} htmlFor="brief-inspiration">
                  Anything else Maya should know?
                </label>
                <textarea
                  className={styles.textarea}
                  id="brief-inspiration"
                  onChange={(event) => update("brief", event.target.value)}
                  placeholder="A color palette, a memory, or a feeling..."
                  value={form.brief}
                />
              </section>
            )}

            {step === 3 && (
              <>
                <section className={styles.formCard}>
                  <div className={styles.formCardHeader}>
                    <div>
                      <h2>Target Delivery &amp; Studio Timeline</h2>
                      <p>When are you hoping to have your piece in hand?</p>
                    </div>
                  </div>
                  <label className={styles.fieldLabel} htmlFor="delivery">Ideal delivery date</label>
                  <input
                    className={styles.field}
                    id="delivery"
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(event) => update("delivery", event.target.value)}
                    type="date"
                    value={form.delivery}
                  />
                  <p className={styles.note}>Estimated making time: {studioTime}. Maya will confirm availability.</p>
                </section>
                <section className={styles.formCard}>
                  <div className={styles.formCardHeader}>
                    <div>
                      <h2>How can Maya reach you?</h2>
                      <p>Your details will be included in the email draft.</p>
                    </div>
                    <span className={styles.required}>REQUIRED</span>
                  </div>
                  <label className={styles.fieldLabel} htmlFor="name">Name</label>
                  <input
                    autoComplete="name"
                    className={styles.field}
                    id="name"
                    onChange={(event) => update("name", event.target.value)}
                    required
                    value={form.name}
                  />
                  <label className={styles.fieldLabel} htmlFor="email">Email</label>
                  <input
                    autoComplete="email"
                    className={styles.field}
                    id="email"
                    onChange={(event) => update("email", event.target.value)}
                    required
                    type="email"
                    value={form.email}
                  />
                </section>
              </>
            )}

            {error && <p className={styles.formError} role="alert">{error}</p>}
            <div className={styles.formActions}>
              <button
                className={styles.outlineAction}
                disabled={step === 0}
                onClick={() => {
                  setStep((current) => Math.max(current - 1, 0));
                  setError("");
                }}
                type="button"
              >
                ← Previous
              </button>
              {step < steps.length - 1 ? (
                <button className={styles.action} onClick={goNext} type="button">
                  Continue <span aria-hidden="true">→</span>
                </button>
              ) : (
                <button className={styles.action} type="submit">
                  Review request <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          </div>
        )}

        {!reviewing && (
          <aside className={styles.summary}>
            <p className={styles.eyebrow}>YOUR REQUEST</p>
            <h2>Personal ledger</h2>
            <div className={styles.summaryArtist}>
              <Image
                className={styles.artistAvatar}
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                alt=""
                width={35}
                height={35}
              />
              <span>
                <strong>Maya Linnea Chen</strong>
                <small>Student artist · Calgary, AB</small>
              </span>
            </div>
            <div className={styles.summaryLine}>
              <span>Artwork type</span><strong>{form.medium}</strong>
            </div>
            <div className={styles.summaryLine}>
              <span>Estimated studio time</span><strong>{studioTime}</strong>
            </div>
            <div className={styles.summaryLine}>
              <span>Materials &amp; making</span><strong>{formatPrice(materials)}</strong>
            </div>
            <div className={styles.summaryLine}>
              <span>Artist fee</span><strong>{formatPrice(artistFee)}</strong>
            </div>
            <div className={styles.summaryTotal}>
              <span>Estimated total</span><strong>{formatPrice(total)}</strong>
            </div>
            <p className={styles.note}>
              Planning estimate only. Maya will confirm the final scope,
              timeline, and price before any commitment.
            </p>
          </aside>
        )}
      </form>
    </>
  );
}
