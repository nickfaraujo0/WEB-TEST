// @ts-check

/**
 * Page object for the Create Opportunity form (/opportunity/create?type=Jobs|Internship|...)
 * and the Preview/Publish step that follows it.
 *
 * Known quirk, confirmed live: the top navbar header on both the create form and the
 * preview page is stuck reading "Create Event" / "Preview Event" regardless of the actual
 * type being created (Jobs, Internship, ...). The in-page "Create Opportunity" heading and
 * the "Job/Internship Details" heading on the preview page ARE correct — only the navbar
 * text is wrong.
 */
export class CreateOpportunityPage {
  constructor(page) {
    this.page = page;
    this.jobTypeSelect = page.locator('.ant-select.eventType');
    this.titleInput = page.locator('input[name="title"]');
    this.descriptionEditor = page.locator('.ql-editor[contenteditable="true"]');
    this.organizationSelect = page.locator('.ant-select.org');
    this.organizationSearchInput = this.organizationSelect.locator('input[type="search"]');
    this.organizationCreateButton = page.getByRole('button', { name: 'Create' });
    this.websiteUrlInput = page.locator('input[name="website"]');
    this.registrationUrlInput = page.locator('input[name="applyNow"]');
    this.deadlineDateInput = page.getByPlaceholder('Select date');
    this.deadlineTimeInput = page.getByPlaceholder('Select time');
    this.previewButton = page.getByRole('button', { name: 'Preview' });
    this.fieldError = page.locator('.ant-form-item-explain-error');
  }

  async goto(type) {
    await this.page.goto(`https://hive-dev.thegritcity.com/opportunity/create?type=${type}`);
  }

  async selectJobType(optionText) {
    await this.jobTypeSelect.click();
    await this.page.locator('.ant-select-item-option', { hasText: optionText }).first().click();
  }

  async fillDescription(text) {
    await this.descriptionEditor.click();
    await this.descriptionEditor.fill(text);
  }

  async selectOrganization(searchText, optionText) {
    await this.organizationSelect.click();
    await this.organizationSearchInput.fill(searchText);
    await this.page.locator('.ant-select-item-option', { hasText: optionText }).first().click();
  }
}

export class PreviewOpportunityPage {
  constructor(page) {
    this.page = page;
    this.publishButton = page.getByRole('button', { name: 'Publish' });
    this.applyNowButton = page.getByRole('button', { name: 'Apply Now' });
    this.deadlineText = page.getByText(/^Deadline/);
  }
}
