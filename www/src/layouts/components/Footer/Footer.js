import Container from 'components/Container';
import FooterLink from './FooterLink';
import FooterNav from './FooterNav';
import FooterTitle from './FooterTitle';
import {colors, fonts, media} from 'theme';

import ossLogoPng from 'images/oss_logo.png';

const Footer = () => (
  <footer
    css={{
      backgroundColor: colors.darker,
      color: colors.white,
      paddingTop: 50,
      paddingBottom: 50,

      [media.xxlarge]: {
        paddingTop: 80,
      },
    }}>
    <Container>
      <div
        css={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}>
        <FooterNav>
          <FooterTitle>Docs</FooterTitle>
          <FooterLink to="#">Quick Start</FooterLink>
          <FooterLink to="#">Thinking in React</FooterLink>
          <FooterLink to="#">Tutorial</FooterLink>
          <FooterLink to="#">Advanced Guides</FooterLink>
        </FooterNav>
        <FooterNav>
          <FooterTitle>Community</FooterTitle>
          <FooterLink to="#">Stack Overflow</FooterLink>
          <FooterLink to="#">Discussion Forum</FooterLink>
          <FooterLink to="#">Reactiflux Chat</FooterLink>
          <FooterLink to="#">Facebook</FooterLink>
          <FooterLink to="#">Twitter</FooterLink>
        </FooterNav>
        <FooterNav>
          <FooterTitle>Resources</FooterTitle>
          <FooterLink to="#">Conferences</FooterLink>
          <FooterLink to="#">Videos</FooterLink>
          <FooterLink to="#">Examples</FooterLink>
          <FooterLink to="#">Complementary Tools</FooterLink>
        </FooterNav>
        <FooterNav>
          <FooterTitle>More</FooterTitle>
          <FooterLink to="#">Blog</FooterLink>
          <FooterLink to="#">GitHub</FooterLink>
          <FooterLink to="#">React Native</FooterLink>
          <FooterLink to="#">Acknowledgements</FooterLink>
        </FooterNav>
        <section
          css={{
            [media.xlargeUp]: {
              width: 'calc(100% / 3)',
              order: -1,
            },
            [media.largeDown]: {
              textAlign: 'center',
              width: '100%',
              paddingTop: 40,
            },
          }}>
          <a href="https://code.facebook.com/projects/">
            <img
              alt="Facebook Open Source"
              css={{
                maxWidth: 160,
                height: 'auto',
              }}
              src={ossLogoPng}
            />
          </a>
          <p
            css={{
              color: colors.subtle,
              paddingTop: 15,
            }}>
            Copyright © 2017 Facebook Inc.
          </p>
        </section>
      </div>
    </Container>
  </footer>
);

export default Footer;
