import Image from "next/image";
// import { BsSoundwave } from "react-icons/bs";
import { AudioLines } from "lucide-react";

import { Container } from "@/components/container/container";
// import { count as soundCount } from "@/lib/sounds";

import styles from "./hero.module.css";

// const count = soundCount();

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div aria-hidden="true" className={styles.background}>
        <Image
          src="/images/hero-background.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles.backgroundImage}
        />
      </div>

      <Container>
        <div className={styles.wrapper}>
          <div className={styles.logoWrapper}>
            <Image
              src="/logo.svg"
              alt=""
              aria-hidden="true"
              width={44}
              height={44}
              className={styles.logo}
            />
          </div>

          <h1 className={styles.title}>
            Ambient Sounds
            <br />
            For Focus and Calm
          </h1>

          <p className={styles.desc}>Free for your focus</p>

          <p className={styles.sounds}>
            <span aria-hidden="true" className={styles.icon}>
              {/* <BsSoundwave /> */}
              <AudioLines />
            </span>

            <span className={styles.label}>
              {/* <strong>{count}</strong> ambient sounds */}
              <strong>67</strong> ambient sounds
            </span>
          </p>
        </div>
      </Container>
    </section>
  );
}
