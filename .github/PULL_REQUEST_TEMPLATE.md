Creating a pull request template for your repository
When you add a pull request template to your repository, project contributors will automatically see the template's contents in the pull request body.

In this article
Adding a pull request template
Further reading
For more information, see "About issue and pull request templates."

You can create a PULL_REQUEST_TEMPLATE/ subdirectory in any of the supported folders to contain multiple pull request templates, and use the template query parameter to specify the template that will fill the pull request body. For more information, see "About automation for issues and pull requests with query parameters."

You can create default pull request templates for your organization or user account. For more information, see "Creating a default community health file."

Adding a pull request template
On GitHub, navigate to the main page of the repository.

Above the list of files, using the Add file drop-down, click Create new file.

"Create new file" in the "Add file" dropdown
In the file name field:

To make your pull request template visible in the repository's root directory, name the pull request template pull_request_template.md.
New pull request template name in root directory
To make your pull request template visible in the repository's docs directory, name the pull request template docs/pull_request_template.md.
New pull request template in docs directory
To store your file in a hidden directory, name the pull request template .github/pull_request_template.md.
New pull request template in hidden directory
To create multiple pull request templates and use the template query parameter to specify a template to fill the pull request body, type .github/PULL_REQUEST_TEMPLATE/, then the name of your pull request template. For example, .github/PULL_REQUEST_TEMPLATE/pull_request_template.md. You can also store multiple pull request templates in a PULL_REQUEST_TEMPLATE subdirectory within the root or docs/ directories. For more information, see "About automation for issues and pull requests with query parameters."
New multiple pull request template in hidden directory
In the body of the new file, add your pull request template. This could include:

A reference to a related issue in your repository.
A description of the changes proposed in the pull request.
@mentions of the person or team responsible for reviewing proposed changes.
At the bottom of the page, type a short, meaningful commit message that describes the change you made to the file. You can attribute the commit to more than one author in the commit message. For more information, see "Creating a commit with multiple co-authors."

Commit message for your change
Below the commit message fields, decide whether to add your commit to the current branch or to a new branch. If your current branch is master, you should choose to create a new branch for your commit and then create a pull request. For more information, see "Creating a new pull request."

Commit branch options Templates are available to collaborators when they are merged into the repository's default branch.
Click Propose new file.

Propose new file button
