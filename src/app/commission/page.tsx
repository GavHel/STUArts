import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import styles from "../experience.module.css";

export const metadata: Metadata = {
  title: "Commission Request Builder | StartUArts",
  description: "Create a personalized artwork commission request with a Calgary student artist.",
};

const steps = [
  "Artwork details",
  "Dimensions & scale",
  "Inspiration",
  "Timeline",
];

const mediums = [
  { icon: "▧", title: "Painting", detail: "Oil, acrylic, watercolor" },
  { icon: "◉", title: "Ceramics", detail: "Functional or sculptural" },
  { icon: "✳", title: "Mixed media", detail: "A little bit of everything" },
  { icon: "▱", title: "Printmaking", detail: "Originals and editions" },
];

export default function CommissionPage() {
  return (
    <main className={styles.page}>
      <SiteHeader active="commission" />
      <div className={styles.content}>
        <section className={styles.commissionIntro}>
          <div className={styles.crumb}>
            <Link href="/">Artists</Link>
            <span>/</span>
            <span>Commission request</span>
          </div>
          <p className={styles.eyebrow}>MADE FOR YOU, MADE TO LAST</p>
          <h1 className={styles.title}>
            Commission <em>Request Builder</em>
          </h1>
          <p className={styles.lead}>
            Tell Maya a little about what you have in mind. We&apos;ll make the
            details clear, so you can focus on making something meaningful
            together.
          </p>
        </section>

        <div className={styles.steps} aria-label="Commission request steps">
          {steps.map((step, index) => (
            <div
              className={`${styles.step} ${index === 0 ? styles.stepActive : ""}`}
              key={step}
              aria-current={index === 0 ? "step" : undefined}
            >
              <span className={styles.stepNumber}>{index + 1}</span>
              {step}
            </div>
          ))}
        </div>

        <div className={styles.commissionGrid}>
          <form className={styles.formStack}>
            <section className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div>
                  <h2>Artistic Medium &amp; Substrate</h2>
                  <p>What kind of work would you love to bring to life?</p>
                </div>
                <span className={styles.required}>REQUIRED</span>
              </div>
              <div className={styles.choiceGrid}>
                {mediums.map((medium, index) => (
                  <label
                    className={`${styles.choice} ${index === 0 ? styles.choiceSelected : ""}`}
                    key={medium.title}
                  >
                    <input
                      type="radio"
                      name="medium"
                      value={medium.title}
                      defaultChecked={index === 0}
                      hidden
                    />
                    <span className={styles.choiceIcon} aria-hidden="true">
                      {medium.icon}
                    </span>
                    <strong>{medium.title}</strong>
                    <small>{medium.detail}</small>
                  </label>
                ))}
              </div>
            </section>

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
                  <label className={styles.fieldLabel} htmlFor="width">
                    Width
                  </label>
                  <input className={styles.field} id="width" placeholder="e.g. 18" />
                </div>
                <div>
                  <label className={styles.fieldLabel} htmlFor="height">
                    Height
                  </label>
                  <input className={styles.field} id="height" placeholder="e.g. 24" />
                </div>
                <div>
                  <label className={styles.fieldLabel} htmlFor="units">
                    Units
                  </label>
                  <select className={styles.select} id="units" defaultValue="inches">
                    <option value="inches">Inches</option>
                    <option value="centimeters">Centimeters</option>
                  </select>
                </div>
              </div>
              <label className={styles.fieldLabel} htmlFor="scale">
                Or select a scale
              </label>
              <select className={styles.select} id="scale" defaultValue="">
                <option value="" disabled>
                  Choose a familiar size
                </option>
                <option>Small — fits on a bookshelf</option>
                <option>Medium — about the size of a carry-on</option>
                <option>Large — makes a statement on the wall</option>
              </select>
            </section>

            <section className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div>
                  <h2>Intended Artistic Placement</h2>
                  <p>Where will your new piece find its home?</p>
                </div>
              </div>
              <div className={styles.choiceGrid}>
                {["Living space", "Office or studio", "A thoughtful gift", "Somewhere else"].map(
                  (placement, index) => (
                    <label
                      className={`${styles.choice} ${index === 0 ? styles.choiceSelected : ""}`}
                      key={placement}
                    >
                      <input
                        type="radio"
                        name="placement"
                        value={placement}
                        defaultChecked={index === 0}
                        hidden
                      />
                      <span className={styles.choiceIcon} aria-hidden="true">
                        {["⌂", "▦", "✳", "＋"][index]}
                      </span>
                      <strong>{placement}</strong>
                    </label>
                  ),
                )}
              </div>
              <label className={styles.fieldLabel} htmlFor="brief">
                A few words about your idea
              </label>
              <textarea
                className={styles.textarea}
                id="brief"
                placeholder="Colors, a feeling, a story, or anything else you'd like Maya to know..."
              />
            </section>

            <section className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div>
                  <h2>Visual Moodboard &amp; Inspirations</h2>
                  <p>Share a link that helps describe what you&apos;re imagining.</p>
                </div>
              </div>
              <label className={styles.fieldLabel} htmlFor="inspiration">
                Inspiration link
              </label>
              <input
                className={styles.field}
                id="inspiration"
                type="url"
                placeholder="Paste a Pinterest, photo, or reference link"
              />
            </section>

            <section className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div>
                  <h2>Target Delivery &amp; Studio Timeline</h2>
                  <p>When are you hoping to have your piece in hand?</p>
                </div>
              </div>
              <label className={styles.fieldLabel} htmlFor="delivery">
                Ideal delivery date
              </label>
              <input className={styles.field} id="delivery" type="date" />
            </section>
          </form>

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
              <span>Artwork type</span>
              <strong>Painting</strong>
            </div>
            <div className={styles.summaryLine}>
              <span>Estimated studio time</span>
              <strong>3—4 weeks</strong>
            </div>
            <div className={styles.summaryLine}>
              <span>Materials &amp; making</span>
              <strong>$850.00</strong>
            </div>
            <div className={styles.summaryLine}>
              <span>Artist fee</span>
              <strong>$300.00</strong>
            </div>
            <div className={styles.summaryTotal}>
              <span>Estimated total</span>
              <strong>CAD $1,150</strong>
            </div>
            <p className={styles.note}>
              Your estimate is a starting point. Maya will confirm the final
              scope, timeline, and price before any commitment.
            </p>
            <button className={styles.action} type="button">
              Review request <span aria-hidden="true">→</span>
            </button>
          </aside>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
