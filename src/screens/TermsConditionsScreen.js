import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import { theme } from '../styles/theme';

export default function TermsConditionsScreen({ navigation }) {
  return (
    <AppScreen safeArea={true} padding={false} backgroundColor={theme.colors.background}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color={theme.colors.textBlack} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle} weight="bold">Terms & Conditions</AppText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <AppText style={styles.sectionTitle} weight="bold">SCOOBYZ TERMS OF SERVICE, PRIVACY POLICY AND SERVICE AGREEMENT</AppText>
        <AppText style={styles.paragraph}>Last Updated: 06/2026</AppText>
        <AppText style={styles.paragraph}>
          These Terms and ConditionsTerms of Service, Privacy Policy and Service Agreement (“Terms”) are issued by [Scoobyz — insert exact registered firm name], a partnership firm registered under applicable laws and having its principal place of business at 205, Narmada Block, Anand Ashray Society, Sector Phi-2, GH-07A, Greater Noida, Uttar Pradesh 201308 (“Scoobyz”, “we”, “us”). These Terms govern access to and use of the Scoobyz mobile application, website, and related pet-care services (collectively, the “Platform”). By creating an account, making a booking, or using the Platform, you agree to be bound by these Terms. By agreeing to these Terms, whether by clicking “I agree”, creating an account, making a booking, or otherwise using the Platform, you confirm that you have read and understood these Terms, and you are legally bound by the terms and conditions specified herein.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">1. Eligibility and Account Registration</AppText>
        <AppText style={styles.paragraph}>
          You must be at least 18 and legally capable of contracting under Indian law. You are responsible for your account credentials and all activity on your account, and must ensure that all information you provide including your own details and your pet’s vaccination records, medical history, behavioural information, licensing requirements, and emergency contacts is accurate, complete, and current. We do not knowingly create accounts for, or collect the personal data of, persons below 18 years of age.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">2. Scoobyz Services</AppText>
        <AppText style={styles.paragraph}>
          Scoobyz is a technology platform that facilitates pet-care services (dog walking, grooming, boarding, veterinary appointment facilitation, memberships, and loyalty programmes), delivered by independent service providers or licensed veterinary professionals who are solely responsible for their own licences, registrations, qualifications, and insurance. Scoobyz manages bookings, payments, scheduling, and support, but does not practise veterinary medicine, diagnose, prescribe, or make medical decisions; that responsibility remains with the treating veterinarian. Scoobyz may substitute service providers and does not guarantee the availability of any provider, slot, service, or location. These Terms create no employment, partnership, agency, fiduciary, or joint-venture relationship.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">2A. Service Arrangement between You, Scoobyz and Service Providers</AppText>
        <AppText style={styles.paragraph}>
          The contract for the actual pet care service is between you and the independent service provider or treating veterinarian, who is solely responsible for the manner, quality and safety of that service. Scoobyz facilitates the booking, payment, scheduling and support. Where Scoobyz sets the price or service standards, it accepts responsibility only to that extent, and subject to the limits in these Terms. Service providers are engaged as independent contractors on a commission basis; they are not employees, agents or partners of Scoobyz. To the fullest extent permitted by law, Scoobyz is not responsible or liable for the acts, omissions, negligence, or misconduct of any independent service provider or veterinarian.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">3. User Responsibilities</AppText>
        <AppText style={styles.paragraph}>
          You must provide accurate, up-to-date information; keep your pet vaccinated, healthy, and suitable for the booked service; disclose aggression, medical conditions, or special handling needs; comply with applicable laws and community rules; and not misuse or seek unauthorised access to the Platform. You warrant your pet has all legally required vaccinations and remain responsible for any injury, loss, or damage your pet causes to providers, third parties, animals, or property. Where a service requires home access, you authorise Scoobyz and the assigned provider to enter solely to deliver that service, and you remain responsible for safe and accurate access arrangements (keys, codes, alarms, smart locks, etc.). You are also responsible for complying with the rules of your society or resident welfare association applicable to pets and to service providers in common areas.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">4. Right to Refuse or Discontinue Services</AppText>
        <AppText style={styles.paragraph}>
          Scoobyz and service providers may refuse, suspend, reschedule, or terminate a service for safety, animal welfare, legal compliance, operational reasons, force majeure, or inaccurate/misleading information and may immediately discontinue service if a pet poses a safety risk to people, animals, property, or itself.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">5. Payments, Memberships and Loyalty Rewards</AppText>
        <AppText style={styles.paragraph}>
          All fees and applicable taxes are shown before booking confirmation. Paws Points and other loyalty or promotional benefits have no cash value and are non-transferable, non-refundable, and revocable, creating no property or monetary rights; Scoobyz may modify, restrict, expire, or discontinue any such programme on reasonable notice. Memberships may auto-renew as disclosed at purchase, and users may cancel future renewals. Cancellations, rescheduling, and refunds are governed by the applicable service-specific policies on the Platform. Payments are processed through a payment aggregator authorised by the Reserve Bank of India, and Scoobyz does not retain customer funds in its own account beyond its booking fee and commission. For veterinary services, the treating veterinarian or clinic raises its own invoice for professional charges, and Scoobyz raises a separate invoice only for its booking fee and commission. All applicable taxes, including Goods and Services Tax as and when Scoobyz becomes liable to register, are charged in accordance with law. Refund terms for annual and pre paid membership plans, including any pro rata refund on cancellation, are as stated in the cancellation policy on the Platform. [Pro rata refund formula for annual plans to be confirmed with Kunal.] Paws Points are a promotional loyalty feature only; they are not a prepaid payment instrument, and cannot be redeemed for cash or transferred to any person. Any automatically renewing membership is enabled only with your prior opt in, is disclosed at purchase, and may be cancelled at any time before the renewal date, and you will be notified before each renewal. If a service provider cancels or fails to attend, Scoobyz may, as its sole remedies to you, arrange a replacement, reschedule the booking, or issue a refund.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">6. Privacy and Data Protection (Privacy Policy)</AppText>
        <AppText style={styles.paragraph}>
          Scoobyz collects and processes personal data needed to provide and improve its services including contact details, addresses, pet information, booking and payment records, communications, photographs, and location data in accordance with applicable Indian law and its Privacy Policy. We process personal data under the Digital Personal Data Protection Act, 2023, only for the purposes stated in these Terms and for compatible legal, safety and fraud prevention purposes, and not otherwise. We share personal data with the assigned service provider or veterinarian to the extent needed to deliver the service, with our payment aggregator to process payments, and with authorities where required by law; we do not sell personal data to advertisers. Location data is collected only where a service, such as dog walking, requires it, and only for the period reasonably necessary. We retain personal data only for as long as required for these purposes or by law. You may access, correct or erase your personal data, or withdraw consent, by writing to our Grievance Officer at the contact published on the Platform. By using the Platform, you consent to this processing for legitimate business, legal, safety, fraud-prevention, and operational purposes, and to receiving service, transactional, legal, and promotional communications via email, SMS, calls, WhatsApp, or in-app notifications.and to receiving service, transactional and legal communications necessary for the service. Promotional communications by email, SMS, call or WhatsApp are sent only if you separately opt in, and you may withdraw that consent at any time, in accordance with the Telecom Commercial Communications Customer Preference Regulations, 2018.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">7. Service-Specific Risk Acknowledgements</AppText>
        <AppText style={styles.paragraph}>
          You acknowledge that pet care carries inherent, unavoidable risks illness, injury, escape, transportation incidents, behavioural changes, stress, animal interactions, weather exposure, disease, emergencies, and equipment failure — , that cannot be fully eliminated despite reasonable care. Boarding involves shared environments with no guarantee of complete separation or a disease-free setting; walking involves public-space, traffic, weather, and third-party-animal risks; grooming may involve minor cuts, irritation, nail bleeding, or allergic reactions.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">8. Emergency Veterinary Care Authorisation</AppText>
        <AppText style={styles.paragraph}>
          If your pet needs urgent care and you cannot be reached within a reasonable time, you authorise Scoobyz and/or the provider to arrange necessary veterinary treatment, up to a limit authorised in advance and disclosed at booking, relying on the emergency contacts and authorisations given at booking. Resulting veterinary, transport, and medication costs remain your responsibility unless otherwise agreed in writing. Any insurance offered by Scoobyz, if applicable, applies only in accordance with the relevant policy terms, conditions, and limits, and does not enlarge the liability of Scoobyz under these Terms.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">9. Pet Incidents</AppText>
        <AppText style={styles.paragraph}>
          If a pet is injured, becomes ill, escapes, or dies during a service, Scoobyz and the provider may investigate requesting records, photographs, vet reports, or witness statements and you agree to cooperate. Scoobyz may notify veterinarians, emergency contacts, insurers, law enforcement, or welfare/regulatory authorities as reasonably necessary. Compensation, if any, is determined by applicable law, the facts, and available evidence; an incident occurring does not by itself constitute an admission of liability.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">10. Abandoned Pets</AppText>
        <AppText style={styles.paragraph}>
          If a pet is not collected within a reasonable period after a boarding-type service and you cannot be reached despite reasonable efforts, Scoobyz and/or the provider may take steps necessary to protect the pet’s welfare including continued boarding, veterinary treatment, transfer to a welfare organisation, fostering, or rehoming. You remain responsible for reasonable resulting costs to the extent permitted by law.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">11. Verification and Certification Disclaimer</AppText>
        <AppText style={styles.paragraph}>
          Any badge, rating, review, certification, inspection, or listing status shown on the Platform reflects information available at the time and is not a guarantee of safety, quality, suitability, legality, or future performance. You remain responsible for exercising your own judgment when selecting services. Scoobyz carries out provider checks only to the extent described on the Platform, and gives no wider assurance about any provider.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">12. Intellectual Property</AppText>
        <AppText style={styles.paragraph}>
          All rights in the Platform software, trademarks (including trademarks applied for or pending registration), logos, content, design, technology, and databases belong to Scoobyz or its licensors. You may not copy, modify, distribute, reverse-engineer, scrape, or commercially exploit any part of the Platform without Scoobyz’s prior written consent. The name “Scoobyz”, the Scoobyz logo and any tagline associated therewith are the exclusive property of Scoobyz. Any unauthorised use, imitation or registration of these marks, or of any confusingly similar mark, is prohibited and may attract action under the Trade Marks Act, 1999, the Copyright Act, 1957, and the law of passing off, in addition to any other remedy available to Scoobyz.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">13. User Content and Media Rights</AppText>
        <AppText style={styles.paragraph}>
          You are solely responsible for content you submit (reviews, photos, videos, comments, ratings) and must not post unlawful, defamatory, infringing, or otherwise objectionable material. Scoobyz may remove or moderate content that violates these Terms or its policies. By submitting content, you grant Scoobyz a non-exclusive, royalty-free licence to use, reproduce, store, and display it to operate, improve, secure, and promote the Platform, subject to the Privacy Policy. Unlawful content may be reported to the Grievance Officer and will be dealt with within the timelines under the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">14. Electronic Records</AppText>
        <AppText style={styles.paragraph}>
          Scoobyz may maintain records of bookings, communications, GPS logs, timestamps, payments, photographs/videos, service reports, and support interactions, used for operations, safety, analytics, fraud prevention, dispute resolution, and legal compliance.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">15. Disclaimers and Limitation of Liability</AppText>
        <AppText style={styles.paragraph}>
          The Platform and all services are provided on an “as is” and “as available” basis, without warranty of any kind, express or implied, except as cannot be excluded under law. Scoobyz does not guarantee uninterrupted Platform access, specific service outcomes, or provider availability. To the maximum extent permitted by law, Scoobyz is not liable for indirect, incidental, consequential, special, exemplary, punitive, or loss-of-profit damages; liability that cannot legally be excluded (e.g., for fraud or wilful misconduct) is unaffected. Any compensation will reflect the nature of the claim, fees paid, conduct of the parties, evidence, and applicable contractual limits. In any event, and to the extent permitted by law, the total aggregate liability of Scoobyz for any claim, whether in contract, tort or otherwise, arising out of or in connection with a service, shall not exceed the fee charged for that service. Nothing in these Terms limits any right you have as a consumer under the Consumer Protection Act, 2019.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">16. Chargebacks, Circumvention and Platform Protection</AppText>
        <AppText style={styles.paragraph}>
          If a user disputes a charge for services already rendered, Scoobyz may recover the disputed amount, suspend the account, offset sums owed, and pursue other remedies. Users must not circumvent the Platform through direct arrangements that avoid fees owed for providers introduced via Scoobyz. Scoobyz may investigate suspected fraud, misuse, or violations of these Terms.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">17. Suspension and Termination</AppText>
        <AppText style={styles.paragraph}>
          Scoobyz may suspend, restrict, or terminate access for violating these Terms, providing false information, engaging in fraud, abuse, or unlawful conduct, creating risk to others, or circumventing Platform policies or fees. Users may stop using the Platform at any time. Provisions on payments, refunds, loyalty programmes, IP, user content, evidence, indemnities, liability limits, dispute resolution, and any others intended to survive, do survive termination.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">18. Indemnity</AppText>
        <AppText style={styles.paragraph}>
          You agree to indemnify, defend, and hold harmless Scoobyz, its affiliates, partners, officers, employees, contractors, and service providers against claims, losses, damages, and reasonable legal costs arising from your breach of these Terms, information you provided, your pet’s actions, illness, or conduct, damage caused by your pet, your misuse of the Platform, or your violation of law or third-party rights. This indemnity is at your own cost, survives termination, and is in addition to any other right of Scoobyz.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">19. Force Majeure</AppText>
        <AppText style={styles.paragraph}>
          Scoobyz is not liable for delays or failures caused by events beyond its reasonable control, including natural disasters, severe weather, epidemics or pandemics, animal disease outbreaks, government action, labour disputes, civil disturbances, telecommunications or internet outages, cyber incidents, or payment-system disruptions.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">20. Governing Law and Dispute Resolution</AppText>
        <AppText style={styles.paragraph}>
          These Terms are governed by the laws of India. Disputes will first be attempted to be resolved amicably and through the Grievance Officer. If still unresolved, the dispute shall be referred to arbitration by a sole arbitrator under the Arbitration and Conciliation Act, 1996; the seat and venue of arbitration shall be Gautam Buddh Nagar, Uttar Pradesh, and the language shall be English; if unresolved, they are subject to the exclusive jurisdiction of the courts in Noida, Uttar Pradesh, India.at Gautam Buddh Nagar, Uttar Pradesh, India. Nothing in this clause affects any right a consumer may have to approach the consumer disputes redressal fora under the Consumer Protection Act, 2019.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">21. Changes to These Terms</AppText>
        <AppText style={styles.paragraph}>
          Scoobyz may update these Terms from time to time. Material changes will be communicated via the Platform, email, or other reasonable means at least 30 days before they take effect, and continued use after changes take effect constitutes acceptance of the revised Terms. For changes that affect pricing, your rights, or your liability, we will seek your specific acknowledgment, and such changes will not apply to you until you accept them.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">22. Contact and Grievance Redressal</AppText>
        <AppText style={styles.paragraph}>
          Scoobyz maintains a grievance redressal mechanism in accordance with applicable law. The Grievance Officer, who is one of the founders of Scoobyz, may be contacted at [name], [designation], [email] and [phone]. Complaints are acknowledged within 48 hours and ordinarily resolved within one month, in accordance with the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021. The Grievance Officer’s name, designation, email address, and contact details are published on the Platform, and grievances will be acknowledged and addressed per legal requirements. Complaints may be submitted through the contact channels provided on the Platform.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">23. Compliance with Applicable Laws</AppText>
        <AppText style={styles.paragraph}>
          Scoobyz conducts its business in accordance with all applicable laws in force in India, including the Consumer Protection Act, 2019 and the rules made under it, the Information Technology Act, 2000 and the rules made under it, the Digital Personal Data Protection Act, 2023, and applicable tax laws. Scoobyz endeavours to keep its practices updated as the law changes. You too must use the Platform only for lawful purposes and in compliance with applicable law.
        </AppText>

        <AppText style={styles.sectionTitle} weight="bold">24. General</AppText>
        <AppText style={styles.paragraph}>
          These Terms, together with the policies referred to in them, constitute the entire agreement between you and Scoobyz on their subject matter, and supersede prior understandings. If any provision is held invalid or unenforceable, the remaining provisions continue in full force. A delay or failure by Scoobyz to enforce any right is not a waiver of that right. You may not assign or transfer your rights or obligations without the prior written consent of Scoobyz; Scoobyz may assign these Terms to any successor, affiliate, or acquirer of its business. Headings are for convenience only and do not affect interpretation.
        </AppText>

        <View style={{ height: 40 }} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    padding: 8,
    marginLeft: -5,
  },
  headerTitle: {
    fontSize: 20,
    color: theme.colors.textBlack,
    fontFamily: theme.fonts.heading,
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: theme.colors.textBlack,
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
});
