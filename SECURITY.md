# Security Policy

**Security · Privacy · Trust**

At **Moonday**, the security and privacy of our users are fundamental to the way we design, develop, and maintain our application. We are committed to protecting personal information, maintaining application integrity, and addressing security vulnerabilities through a responsible and continuous security-maintenance process.

Moonday provides a personal space for menstrual cycle tracking, journaling, mood monitoring, reminders, self-care, and everyday organization. We recognize the sensitive nature of this information and consider its protection an essential responsibility.

---

## 1. Our Security Commitment

Security is an ongoing responsibility that extends throughout the application lifecycle, from development and deployment to maintenance and future improvements.

Our approach is guided by five fundamental principles:

| Principle | Commitment |
|:----------|:-----------|
| **Confidentiality** | Protecting personal information against unauthorized access or disclosure. |
| **Integrity** | Maintaining the accuracy, consistency, and reliability of application data. |
| **Availability** | Supporting reliable access to application functionality and services. |
| **Privacy** | Respecting the sensitive nature of personal and wellness-related information. |
| **Continuous Improvement** | Evaluating and strengthening security as the application evolves. |

We strive to incorporate these principles into our technical decisions, application architecture, and ongoing maintenance practices.

---

## 2. Supported Versions

Moonday maintains a continuous security-support policy covering **every version released since the project's inception**.

All previously released versions remain actively supported and covered by our security-update commitment. The availability of a newer release does not, by itself, exclude an earlier version from security support.

| Version | Security Support | Status |
|:--------|:----------------:|:------:|
| All versions released to date | :white_check_mark: | Actively Supported |
| Current release | :white_check_mark: | Actively Supported |
| Future releases | :white_check_mark: | Supported |

### 2.1 Version Support Commitments

Our version-support policy includes the following commitments:

- Every version released to date remains within our security-support scope.
- Confirmed vulnerabilities affecting historical releases are eligible for security remediation.
- Security maintenance is not restricted exclusively to the latest release.
- Security improvements are evaluated according to their severity, exploitability, and potential impact.
- Future releases will continue to receive security support as part of ongoing development.

Users are encouraged to use the latest available release to benefit from the most recent improvements, security enhancements, and application fixes.

**Our commitment is to maintain security support across Moonday's entire release history, regardless of when an individual version was published.**

---

## 3. Reporting a Vulnerability

We encourage security researchers, developers, and community members to report potential vulnerabilities responsibly.

If you discover a security weakness in Moonday, please report it privately and allow the maintainers reasonable time to investigate and address the issue before making it publicly available.

We value responsible disclosure and appreciate contributions that help improve the security and reliability of the project.

### 3.1 Reporting Channels

Please use one of the following designated channels:

| Channel | Reporting Method |
|:--------|:-----------------|
| **GitHub Security Advisories** | Submit a private vulnerability report through the repository's Security tab, provided private vulnerability reporting is enabled. |
| **Security Contact** | Contact the project's officially designated security email address, if published. |

Please do not disclose sensitive vulnerability details through public GitHub issues.

### 3.2 Information to Include

To help us investigate a report efficiently, please provide:

| Information | Description |
|:------------|:------------|
| **Vulnerability Title** | A concise description of the identified issue. |
| **Affected Component** | The relevant page, API endpoint, service, dependency, or application component. |
| **Affected Version** | The version or versions in which the issue was identified. |
| **Technical Description** | A detailed explanation of the vulnerability and its underlying cause, if known. |
| **Reproduction Steps** | Clear steps demonstrating how the issue can be reproduced. |
| **Security Impact** | The potential consequences and severity of exploitation. |
| **Supporting Evidence** | Relevant screenshots, logs, or proof-of-concept material, where appropriate. |
| **Suggested Remediation** | Any proposed mitigation or corrective measure, if available. |

**Important:** Do not include actual users' personal information, authentication credentials, private journal entries, menstrual health records, or other confidential information in vulnerability reports.

---

## 4. Vulnerability Assessment and Response

Every legitimate security report is reviewed to determine its validity, severity, and potential impact.

Our vulnerability-response process follows these stages:

| Stage | Process | Description |
|:-----:|:--------|:------------|
| 01 | Acknowledgment | Confirm receipt of the submitted report. |
| 02 | Initial Review | Examine the information provided and determine the scope of the issue. |
| 03 | Verification | Attempt to reproduce and technically validate the reported vulnerability. |
| 04 | Risk Assessment | Evaluate severity, exploitability, affected components, and potential user impact. |
| 05 | Remediation | Develop and implement an appropriate corrective measure when the vulnerability is confirmed. |
| 06 | Validation | Verify that the corrective measure adequately addresses the identified weakness. |
| 07 | Resolution | Communicate the outcome and coordinate responsible disclosure where appropriate. |

### 4.1 Response Time

We aim to acknowledge security reports within **72 hours** of receipt.

This is a response target, not a guaranteed resolution deadline.

The time required for investigation and remediation depends on several factors, including:

- Severity and potential impact of the vulnerability.
- Technical complexity and reproducibility.
- Number of affected components and versions.
- Potential exposure of sensitive information.
- Dependencies on third-party services.
- Availability of an effective mitigation.

Critical vulnerabilities may receive expedited attention.

---

## 5. Vulnerability Assessment Outcomes

Following investigation, a report may be accepted or declined based on its technical validity and security impact.

### 5.1 Accepted Vulnerabilities

When a vulnerability is confirmed, we aim to:

1. Determine its scope, severity, and potential impact.
2. Identify affected application components and supported versions.
3. Prioritize remediation according to the associated security risk.
4. Implement an appropriate corrective measure.
5. Validate the effectiveness of the remediation.
6. Incorporate the security improvement into the appropriate release or releases.
7. Communicate relevant remediation information when responsible disclosure permits.

Where necessary, interim protective measures may be considered while a permanent fix is being developed.

### 5.2 Declined Reports

A report may be declined when investigation determines that:

- The reported behavior is intentional and does not constitute a security vulnerability.
- The issue cannot be reproduced using the available information.
- The finding falls outside the project's security scope.
- The vulnerability has already been addressed.
- The report does not demonstrate a meaningful security impact.
- The issue results from an incorrect interpretation of the application's intended behavior.

Where reasonably possible, we will communicate the reasoning behind the decision.

Reporters may submit additional technical evidence if they believe the assessment requires reconsideration.

---

## 6. Responsible Disclosure Guidelines

We ask security researchers to conduct their investigations ethically and avoid activities that could compromise users, application availability, or the integrity of Moonday's infrastructure.

Researchers are expected to:

- Avoid accessing, modifying, or disclosing other users' private information.
- Avoid destructive testing against production environments.
- Refrain from activities that disrupt application availability or services.
- Avoid unauthorized extraction, alteration, or destruction of data.
- Avoid social engineering, phishing, or attacks against individuals.
- Allow reasonable time for investigation and remediation.
- Coordinate public disclosure with the project maintainers.

We appreciate good-faith security research and recognize its contribution to improving software security.

---

## 7. Security Areas and Application Components

Moonday's security considerations extend across its application architecture, data-handling mechanisms, and supporting services.

The following areas receive particular attention during development and maintenance:

| Security Area | Primary Consideration |
|:--------------|:----------------------|
| **Authentication** | Secure user authentication and identity verification. |
| **Session Management** | Appropriate handling and protection of authenticated sessions. |
| **Authorization** | Restricting access to resources according to applicable permissions. |
| **Database Security** | Protecting stored information through appropriate database permissions and access policies. |
| **API Security** | Validating requests and protecting application endpoints against unauthorized operations. |
| **Push Notifications** | Secure handling of notification subscriptions and delivery mechanisms. |
| **Service Workers** | Maintaining appropriate browser-side security boundaries. |
| **Personal Information** | Protecting sensitive wellness-related and user-generated information. |
| **Application Dependencies** | Evaluating security concerns involving third-party packages and libraries. |
| **Configuration Management** | Preventing unintended exposure of secrets, credentials, and privileged configuration values. |

These areas describe the project's security priorities and ongoing considerations. Their inclusion does not constitute independent certification or a claim that every control has undergone a formal security audit.

---

## 8. Continuous Security Maintenance

Security requirements evolve alongside application functionality, dependencies, browser capabilities, and infrastructure.

Moonday is committed to incorporating security considerations into its ongoing development and maintenance practices.

Our maintenance priorities include:

- Reviewing reported vulnerabilities and security concerns.
- Addressing identified weaknesses in application functionality.
- Evaluating authentication and authorization mechanisms.
- Reviewing database access controls and security policies.
- Assessing vulnerabilities in third-party dependencies.
- Protecting API endpoints and application integrations.
- Reviewing browser notification and service-worker behavior.
- Improving the handling of sensitive user information.
- Evaluating the security implications of newly introduced functionality.

Security improvements are prioritized according to their potential impact and the resources required for effective remediation.

---

## 9. Scope and Limitations

This policy applies to the Moonday application and its officially maintained components.

Third-party services, infrastructure providers, external libraries, and integrations may operate under separate security policies and vulnerability-disclosure procedures.

When a reported vulnerability originates within a third-party service and falls outside Moonday's control, the appropriate service provider should also be notified.

This policy does not constitute a guarantee of absolute security, uninterrupted availability, or immunity from unauthorized access.

---

## 10. Our Commitment

Moonday is built around the belief that personal well-being deserves a space defined by privacy, reliability, and trust.

We recognize that users place confidence in an application when they entrust it with personal experiences and sensitive information. Maintaining that confidence requires continuous attention to security, responsible development practices, and a willingness to address weaknesses as they are identified.

**Every version of Moonday released to date remains covered by our active security-support commitment.** We are committed to evaluating vulnerabilities across our release history, implementing appropriate security improvements, and strengthening the protection of the people who trust Moonday with their personal information.

We welcome responsible security research, constructive feedback, and collaboration that contributes to a safer and more trustworthy application.

---

<div align="center">

### Moonday

**Security is continuous. Privacy is fundamental. Trust is earned.**

*Built with care. Maintained with responsibility.*

</div>
