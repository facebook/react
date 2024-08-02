import requests
import os
import argparse
import logging
import json
import uuid
import gspread
import random
import shutil
import time
from logging import config
from datetime import datetime, timedelta, timezone
from pathlib import Path
from time import sleep
from copy import deepcopy
from concurrent.futures import ThreadPoolExecutor

LOGGER = logging.getLogger(__name__)

BENCHMARK_RUN_ID = str(uuid.uuid4())

WORKFLOW_TEMPLATE = {
    "commit": None,
    "vendor": None,
    "workflow_id": None,
    "workflow_name": None,
    "workflow_status": None,
    "created_at": None,
    "started_at": None,
    "stopped_at": None,
    "computed_total_time": None,
    "computed_queued_time": None,
    "computed_run_time": None,
    "reported_duration": None,
    "reported_queued_duration": None,
    "workflow_url": None,
    "vcs_url": None
}

JOB_TEMPLATE = {
    "commit": None,
    "vendor": None,
    "job_id": None,
    "job_name": None,
    "job_status": None,
    "created_at": None,
    "started_at": None,
    "stopped_at": None,
    "queued_at": None,
    "computed_total_time": None,
    "computed_queued_time": None,
    "computed_run_time": None,
    "reported_duration": None,
    "reported_queued_duration": None,
    "job_url": None,
    "runner_info": None
}


def main():
    # Parse the arguments passed in
    args = get_args()

    # Configure logging
    load_logging_config(args["debug"], args["log_path"])

    LOGGER.debug("Parsed arguments successfully!")
    run(parsed_args=args)

def load_logging_config(debug, file_path):
    """
    Loads and configures a logging config
    :param debug: True or False if debugging for console should be turned on
    :param file_path: File path to storage the log file
    :return: None
    """
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "debugFormater": {
                "format": "%(asctime)s.%(msecs)03d %(levelname)s [%(threadName)s]: %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "simpleFormater": {
                "format": "%(message)s"
            }
        },
        "handlers": {
            "file": {
                "class": "logging.FileHandler",
                "formatter": "debugFormater",
                "level": "DEBUG",
                "filename": "benchmark.log"
            },
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "simpleFormater",
                "level": "INFO",
                "stream": "ext://sys.stdout"
            }
        },
        "loggers": {
            "": {
                "level": "DEBUG",
                "handlers": ["file"]
            },
            "__main__": {
                "level": "DEBUG",
                "handlers": ["console"],
                "propagate": True
            }
        }
    }

    # If debugging, then switch the console format to be verbose
    if debug:
        logging_config["handlers"]["console"]["formatter"] = "debugFormater"

    # If a file path is passed in then handle the prefix and append the file name
    if file_path:
        log_path = Path(file_path)
        log_path = log_path.joinpath(logging_config["handlers"]["file"]["filename"])
        logging_config["handlers"]["file"]["filename"] = str(log_path)

    # Apply logging config
    logging.config.dictConfig(logging_config)
    LOGGER.debug("Logging Config: " + str(logging_config))
    LOGGER.debug("Logging is configured")

def get_args():
    """
    Processes and handles command line arguments
    :return: Dict of command line arguments
    """
    parser = argparse.ArgumentParser(description="Options for CI/CD Benchmarking Scanner")
    parser.add_argument("--circleci-project-slug",
                        help="CircleCI Project slug in the form vcs-slug/org-name/repo-name",
                        type=str,
                        default=None,
                        required=False)
    parser.add_argument("--github-repo-slug",
                        help="GitHub Repo slug in the form of OWNER/REPO",
                        type=str,
                        default=None,
                        required=False)
    parser.add_argument("--upstream-repo-url",
                        help="Upstream repo's URL",
                        type=str,
                        required=False)
    parser.add_argument("--working-repo-dir",
                        help="The directory of the forked repo",
                        type=str,
                        default=os.environ.get('.'),
                        required=False)
    parser.add_argument("--branch",
                       help="Name of the branch that will be used to run CI/CD pipelines",
                       type=str,
                       default=None)

    parser.add_argument("--circleci-token",
                        help="A valid CircleCI token to be used for interacting with CircleCI's API. Can also be set via env vars by using CIRCLECI_TOKEN",
                        type=str,
                        default=os.environ.get('CIRCLECI_TOKEN'),
                        required=False)
    parser.add_argument("--github-token",
                        help="A valid GitHub token to be used for interacting with GitHub's API. Can also be set via env vars by using GITHUB_TOKEN",
                        type=str,
                        default=os.environ.get('GITHUB_TOKEN'),
                        required=False)

    parser.add_argument("--debug",
                        help="Enable Debug output",
                        action="store_true",
                        default=False)
    parser.add_argument("--dump-json",
                        help="Dumps raw and sanitized data to json file",
                        action="store_true",
                        default=False)
    parser.add_argument("--log-path",
                        help="Path to where the log file will be generated",
                        type=str,
                        default=None)
    parser.add_argument("--google-sheet-id",
                        help="ID of the Google Sheet where metrics will be exported",
                        type=str,
                        default=None,
                        required=True)
    parser.add_argument("--poll-interval",
                        help="Polling interval in seconds when waiting for builds to complete",
                        type=int,
                        default=10)
    parser.add_argument("--max-retries",
                        help="Maximum number of retries for inputting data into Google Sheets",
                        type=int,
                        default=50)
    parser.add_argument("--config-path",
                        help="Path to where the config files are stored on main",
                        type=str,
                        default=None)
    parser.add_argument("--commit-delay",
                        help="Delay in between replay commits",
                        type=int,
                        default=10)
    parser.add_argument("--replay-days",
                        help="The amount of days worth of commits from the upstream repo to replay",
                        type=int,
                        default=1)

    args = parser.parse_args()

    return vars(args)

def run(parsed_args):
    """
    Main function that takes in arguments and processes them
    :param parsed_args: Dict of command line arguments
    """
    # Replay Commits In a Replay Branch
    branch = replay_commits(parsed_args)
    LOGGER.info(f"Triggered commits on branch: {branch}")

    # Gather all Pipeline IDs
    build_ids = get_all_build_ids(parsed_args, branch)

    # Wait for builds to complete
    wait_for_builds_to_complete(parsed_args, build_ids)    
    LOGGER.info("All builds completed!")

    # Collects metrics
    metrics = collect_metrics(parsed_args, build_ids)
    LOGGER.info("Collected metrics!")

    # Dumps raw metrics
    raw_metrics_json = json.dumps(metrics, indent=2)
    LOGGER.debug(raw_metrics_json)

    if parsed_args['dump_json']:
        with open("benchmark-raw.json", "w") as json_file:
            json_file.write(raw_metrics_json)
        LOGGER.info("Dumped raw metrics to benchmark-raw.json")

    # Sanitize metrics
    sanitized_metrics = sanitize_metrics(metrics)
    LOGGER.info("Sanitized metrics!")

    # Compute metrics
    computed_metrics = compute_metrics(sanitized_metrics)
    LOGGER.info("Computed metrics!")

    computed_metrics_json = json.dumps(computed_metrics, indent=2)
    LOGGER.debug(computed_metrics_json)

    if parsed_args['dump_json']:
        with open("benchmark-computed.json", "w") as json_file:
            json_file.write(computed_metrics_json)
        LOGGER.info("Dumped computed metrics to benchmark-computed.json")

    # Export computed metrics to Google Sheets
    export_metrics(computed_metrics, parsed_args['google_sheet_id'], parsed_args['max_retries'])
    LOGGER.info(f"Exported metrics to Google Sheet ID: {parsed_args['google_sheet_id']}")

def replay_commits(args):

    repo = Repo(args['working_repo_dir'])
    branch = ""

    try:
        repo.create_remote('upstream', url=args['upstream_repo_url'])
    except Exception as e:
        print(f"Upstream remote already exists: {e}")
    repo.remotes.upstream.fetch("main")
    commits = []
    for commit in repo.iter_commits("upstream/main"):
        if commit.committed_datetime.date() < (datetime.now(timezone.utc) - timedelta(day=args['replay_days'])).date():
            break
        commits.append(commit)
    commits.reverse()
    print(f"The following commits will be processed:")
    print(f"{commits}", sep="\n")

    push_commits_one_by_one(args, repo, commits)

    return branch

def push_commits_one_by_one(args, repo, commits):
    if args['branch']:
      branch = args['branch']
    else:
      current_date = datetime.now().date().isoformat()
      branch = f"replay-{current_date}"
      args['branch'] = branch

    repo.git.checkout("-B", branch, commit)

    config_path = args['config_path']

    for commit in commits:
        repo.git.checkout("main", config_path)
        original_directory = os.path.join(os.getcwd(), f"{config_path}/.circleci")
        target_directory = os.path.join(os.getcwd(), ".circleci")
        shutil.move(original_directory, target_directory)
        original_directory = os.path.join(os.getcwd(), f"{config_path}/.github")
        target_directory = os.path.join(os.getcwd(), ".github")
        shutil.move(original_directory, target_directory)
        repo.git.add(".github", ".circleci")

        repo.index.commit(f"Committing {commit.hexsha}")
        print(f"Pushing commit {commit.hexsha} to branch {branch}")
        repo.git.push("--force", "origin", branch)
        time.sleep(args['commit_delay'])

    # Delete the branch after all commits have been pushed
    repo.git.checkout("main")
    repo.git.branch("-D", branch)
    repo.remotes.origin.push(refspec=f":{branch}")

    return branch

def get_all_build_ids(args):
    github_ids = get_github_workflow_run_ids(args)
    circleci_ids = get_circleci_pipeline_ids(args)

    #TODO:need to account for other CI tools

    all_ids = {**github_ids, **circleci_ids}

    return all_ids

def get_circleci_pipeline_ids(args):
    branch = args['branch']

    LOGGER.info("Fetching CircleCI workflows...")
    url = f"https://circleci.com/api/v2/project/{args['circleci_project_slug']}/pipeline"
    headers = {"Circle-Token": args['circleci_token']}
    params = {"branch": branch}

    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()

    pipelines = response.json().get("items", [])
    if not pipelines:
        raise ValueError(f"No pipelines found for branch {branch}")

    return {"circleci": [pipeline["pipeline"] for pipeline in pipelines]}

def get_github_workflow_run_ids(args):
    branch = args['branch']

    LOGGER.info("Fetching GitHub workflows...")
    url = f"https://api.github.com/repos/{args['github_repo_slug']}/actions/runs"
    headers = {"Authorization": f"token {args['github_token']}"}
    params = {"branch": branch}

    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    runs = response.json()["workflow_runs"]

    return {"github": [run["run_id"] for run in runs if run["head_branch"] == branch]}

def wait_for_builds_to_complete(args, build_ids):
    with ThreadPoolExecutor() as executor:
        futures = {}
        if args['circleci_project_slug']:
            for id in build_ids['circleci']:
                futures[f"circleci_{id}"] = executor.submit(wait_for_circleci_build, args, id)
        if args['circleci_project_slug'] and args['github_workflow']:
            for id in build_ids['github']:
                futures[f"github_{id}"] = executor.submit(wait_for_github_build, args, id)
        if args['gitlab_project_id']:
            for id in build_ids['gitlab']:
                futures[f"gitlab_{id}"] = executor.submit(wait_for_gitlab_build, args, id)
        if args['harness_org_id'] and args['harness_project_id'] and args['harness_pipeline_id'] and args['harness_account_id']:
            for id in build_ids['harness']:
                futures[f"harness_{id}"] = executor.submit(wait_for_harness_build, args, id)

        for vendor, future in futures.items():
            try:
                future.result()
            except Exception as e:
                LOGGER.error(f"Error waiting for {vendor} build: {e}")

def wait_for_circleci_build(args, pipeline_id):
    LOGGER.info("Waiting for CircleCI build to complete...")
    url = f"https://circleci.com/api/v2/pipeline/{pipeline_id}/workflow"
    headers = {"Circle-Token": args['circleci_token']}
    while True:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        workflows = response.json()['items']

        statuses = [workflow['status'] for workflow in workflows]
        if all(status in ['success', 'failed'] for status in statuses):
            break

        LOGGER.debug("CircleCI build still in progress...")
        sleep(args['poll_interval'])
    LOGGER.info("CircleCI build completed")

def wait_for_github_build(args, workflow_run_id):
    LOGGER.info("Waiting for GitHub build to complete...")
    url = f"https://api.github.com/repos/{args['github_repo_slug']}/actions/runs/{workflow_run_id}"
    headers = {"Authorization": f"token {args['github_token']}"}
    while True:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        status = response.json()['status']
        if status == 'completed':
            break
        LOGGER.debug("GitHub build still in progress...")
        sleep(args['poll_interval'])
    LOGGER.info("GitHub build completed")

def collect_metrics(args, build_ids):
    metrics = {}
    with ThreadPoolExecutor() as executor:
        futures = {}
        if args['circleci_project_slug']:
            futures["circleci"] = executor.submit(collect_circleci_metrics, args, build_ids['circleci'])
        if args['circleci_project_slug'] and args['github_workflow']:
            futures["github"] = executor.submit(collect_github_metrics, args, build_ids['github'])
        if args['gitlab_project_id']:
            futures["gitlab"] = executor.submit(collect_gitlab_metrics, args, build_ids['gitlab'])
        if args['harness_org_id'] and args['harness_project_id'] and args['harness_pipeline_id'] and args['harness_account_id']:
            futures["harness"] = executor.submit(collect_harness_metrics, args, build_ids['harness'])

        for vendor, future in futures.items():
            try:
                metrics[vendor] = future.result()
            except Exception as e:
                LOGGER.error(f"Error collecting {vendor} metrics: {e}")

    return metrics

def collect_circleci_metrics(args, pipeline_id):
    LOGGER.info("Collecting CircleCI metrics...")
    pipeline_url =f"https://circleci.com/api/v2/pipeline/{pipeline_id}"
    headers = {"Circle-Token": args['circleci_token']}
    response = requests.get(pipeline_url, headers=headers)
    response.raise_for_status()
    pipeline = response.json()

    workflow_url = f"https://circleci.com/api/v2/pipeline/{pipeline_id}/workflow"
    headers = {"Circle-Token": args['circleci_token']}
    response = requests.get(workflow_url, headers=headers)
    response.raise_for_status()
    workflows = response.json()['items']

    all_metric_data = []
    for workflow in workflows:
        workflow_id = workflow['id']

        # Collect all job details with pagination
        jobs = []
        jobs_url = f"https://circleci.com/api/v2/workflow/{workflow_id}/job"
        while jobs_url:
            jobs_response = requests.get(jobs_url, headers=headers)
            jobs_response.raise_for_status()
            jobs_data = jobs_response.json()
            jobs.extend(jobs_data['items'])
            
            # Check if there's a next page
            next_page_token = jobs_data.get('next_page_token')
            if next_page_token:
                jobs_url = f"https://circleci.com/api/v2/workflow/{workflow_id}/job?next_page_token={next_page_token}"
            else:
                jobs_url = None

        enriched_jobs = []
        for job in jobs:
            job_number = job['job_number']
            job_details_url = f"https://circleci.com/api/v2/project/{args['circleci_project_slug']}/job/{job_number}"
            job_details_response = requests.get(job_details_url, headers=headers)
            job_details_response.raise_for_status()
            job_details = job_details_response.json()

            # Add commit to job metrics
            job_details['commit'] = pipeline['vcs']['revision']

            enriched_jobs.append(job_details)
        
        # Add commit to workflow metrics
        workflow['commit'] = pipeline['vcs']['revision']

        all_metric_data.append({
            "workflow": workflow,
            "jobs": enriched_jobs
        })

    return all_metric_data

def collect_github_metrics(args, workflow_run_id):
    LOGGER.info("Collecting GitHub metrics...")
    workflow_url = f"https://api.github.com/repos/{args['github_repo_slug']}/actions/runs/{workflow_run_id}"
    headers = {"Authorization": f"token {args['github_token']}"}
    
    # Collect workflow details
    response = requests.get(workflow_url, headers=headers)
    response.raise_for_status()
    workflow = response.json()
    
    # Collect all job details with pagination
    jobs = []
    jobs_url = f"https://api.github.com/repos/{args['github_repo_slug']}/actions/runs/{workflow_run_id}/jobs"
    while jobs_url:
        jobs_response = requests.get(jobs_url, headers=headers)
        jobs_response.raise_for_status()
        jobs_data = jobs_response.json()
        jobs.extend(jobs_data['jobs'])
        
        # Check if there's a next page
        jobs_url = jobs_response.links.get('next', {}).get('url')
    
    return {
        "workflow": workflow,
        "jobs": jobs
    }

def sanitize_metrics(metrics):
    sanitized = {}

    with ThreadPoolExecutor() as executor:
        futures = {}
        if 'circleci' in metrics:
            futures["circleci"] = executor.submit(sanitize_circleci_metrics, metrics.get('circleci'))
        if 'github' in metrics:
            futures["github"] = executor.submit(sanitize_github_metrics, metrics.get('github'))
        if 'gitlab' in metrics:
            futures["gitlab"] = executor.submit(sanitize_gitlab_metrics, metrics.get('gitlab'))
        if 'harness' in metrics:
            futures["harness"] = executor.submit(sanitize_harness_metrics, metrics.get('harness'))

        for vendor, future in futures.items():
            try:
                sanitized[vendor] = future.result()
            except Exception as e:
                LOGGER.error(f"Error sanitizing {vendor} metrics: {e}")

    return sanitized

def sanitize_circleci_metrics(circleci_metrics):
    sanitized_workflow = deepcopy(WORKFLOW_TEMPLATE)
    workflow = circleci_metrics['workflow']

    # Extract VCS URL from project data in one of the jobs
    vcs_url = None
    if circleci_metrics['jobs']:
        project_data = circleci_metrics['jobs'][0].get('project', {})
        vcs_url = project_data.get('external_url')

    sanitized_workflow.update({
        "commit": workflow['commit'],
        "vendor": "CircleCI",
        "workflow_id": workflow['id'],
        "workflow_name": workflow['name'],
        "workflow_status": workflow['status'],
        "created_at": workflow['created_at'],
        "started_at": None,
        "stopped_at": workflow['stopped_at'],
        "workflow_url": f"https://app.circleci.com/pipelines/workflows/{workflow['id']}",
        "vcs_url": vcs_url,
        "reported_duration": None,
        "reported_queued_duration": None
    })

    sanitized_jobs = []
    for job in circleci_metrics['jobs']:
        sanitized_job = deepcopy(JOB_TEMPLATE)

        # Grab executor info
        executor = job["executor"]
        runner_info = f"{executor["type"]}-{executor['resource_class']}"

        # Convert from milliseconds to seconds
        reported_duration = int(job['duration'])/1000

        sanitized_job.update({
            "commit": job['commit'],
            "vendor": "CircleCI",
            "job_id": job['number'],
            "job_name": job['name'],
            "job_status": job['status'],
            "created_at": job['created_at'],
            "started_at": job['started_at'],
            "stopped_at": job['stopped_at'],
            "queued_at": job['queued_at'],
            "reported_duration": reported_duration,
            "reported_queued_duration": None,
            "job_url": job['web_url'],
            "runner_info": runner_info
        })
        sanitized_jobs.append(sanitized_job)

    return {
        "workflow": sanitized_workflow,
        "jobs": sanitized_jobs
    }

def sanitize_github_metrics(github_metrics):
    sanitized_workflow = deepcopy(WORKFLOW_TEMPLATE)
    workflow = github_metrics['workflow']
    sanitized_workflow.update({
        "commit": workflow['head_sha'],
        "vendor": "GitHub",
        "workflow_id": workflow['id'],
        "workflow_name": workflow['name'],
        "workflow_status": workflow['conclusion'],
        "created_at": workflow['created_at'],
        "started_at": workflow['run_started_at'],
        "stopped_at": workflow['updated_at'],
        "workflow_url": workflow['html_url'],
        "vcs_url": workflow['repository']['html_url'],
        "reported_duration": None,
        "reported_queued_duration": None
    })

    sanitized_jobs = []
    for job in github_metrics['jobs']:
        sanitized_job = deepcopy(JOB_TEMPLATE)
        sanitized_job.update({
            "commit": job['head_sha'],
            "vendor": "GitHub",
            "job_id": job['id'],
            "job_name": job['name'],
            "job_status": job['conclusion'],
            "created_at": job['created_at'],
            "started_at": job['started_at'],
            "stopped_at": job['completed_at'],
            "queued_at": None,
            "reported_duration": None,
            "reported_queued_duration": None,
            "job_url": job['html_url'],
            "runner_info": job["labels"][0]
        })
        sanitized_jobs.append(sanitized_job)

    return {
        "workflow": sanitized_workflow,
        "jobs": sanitized_jobs
    }

def compute_metrics(sanitized_metrics):
    """
    Computes metrics for CircleCI, GitHub, and GitLab based on sanitized metrics.
    :param sanitized_metrics: Dict of sanitized metrics
    :return: Dict of computed metrics for each CI/CD vendor
    """
    computed = {}

    with ThreadPoolExecutor() as executor:
        futures = {}
        if 'circleci' in sanitized_metrics:
            futures["circleci"] = executor.submit(compute_circleci_metrics, sanitized_metrics.get('circleci'))
        if 'github' in sanitized_metrics:
            futures["github"] = executor.submit(compute_github_metrics, sanitized_metrics.get('github'))
        # if 'gitlab' in sanitized_metrics:
        #     futures["gitlab"] = executor.submit(compute_gitlab_metrics, sanitized_metrics.get('gitlab'))
        # if 'harness' in sanitized_metrics:
        #     futures["harness"] = executor.submit(compute_harness_metrics, sanitized_metrics.get('harness'))

        for vendor, future in futures.items():
            try:
                computed[vendor] = future.result()
            except Exception as e:
                LOGGER.error(f"Error computing {vendor} metrics: {e}")

    return computed

def compute_circleci_metrics(circleci_metrics):
    """
    Computes metrics for CircleCI based on sanitized metrics.
    :param circleci_metrics: Dict of CircleCI sanitized metrics
    :return: Dict of computed CircleCI metrics
    """
    workflow = circleci_metrics['workflow']
    jobs = circleci_metrics['jobs']

    workflow['computed_total_time'] = (datetime.fromisoformat(workflow['stopped_at'][:-1]) - datetime.fromisoformat(workflow['created_at'][:-1])).total_seconds()
    workflow['computed_queued_time'] = None # CircleCI does not give us started_at time
    workflow['computed_run_time'] = (datetime.fromisoformat(workflow['stopped_at'][:-1]) - datetime.fromisoformat(workflow['created_at'][:-1])).total_seconds() # Might be misleading here

    for job in jobs:
        job['computed_total_time'] = (datetime.fromisoformat(job['stopped_at'][:-1]) - datetime.fromisoformat(job['created_at'][:-1])).total_seconds()
        job['computed_queued_time'] = (datetime.fromisoformat(job['started_at'][:-1]) - datetime.fromisoformat(job['queued_at'][:-1])).total_seconds()
        job['computed_run_time'] = (datetime.fromisoformat(job['stopped_at'][:-1]) - datetime.fromisoformat(job['started_at'][:-1])).total_seconds()

    return circleci_metrics

def compute_github_metrics(github_metrics):
    """
    Computes metrics for GitHub based on sanitized metrics.
    :param github_metrics: Dict of GitHub sanitized metrics
    :return: Dict of computed GitHub metrics
    """
    workflow = github_metrics['workflow']
    jobs = github_metrics['jobs']

    workflow['computed_total_time'] = (datetime.fromisoformat(workflow['stopped_at'][:-1]) - datetime.fromisoformat(workflow['created_at'][:-1])).total_seconds()
    workflow['computed_queued_time'] = (datetime.fromisoformat(workflow['started_at'][:-1]) - datetime.fromisoformat(workflow['created_at'][:-1])).total_seconds()
    workflow['computed_run_time'] = (datetime.fromisoformat(workflow['stopped_at'][:-1]) - datetime.fromisoformat(workflow['started_at'][:-1])).total_seconds()

    for job in jobs:
        job['computed_total_time'] = (datetime.fromisoformat(job['stopped_at'][:-1]) - datetime.fromisoformat(job['created_at'][:-1])).total_seconds()
        job['computed_queued_time'] = (datetime.fromisoformat(job['started_at'][:-1]) - datetime.fromisoformat(job['created_at'][:-1])).total_seconds()
        job['computed_run_time'] = (datetime.fromisoformat(job['stopped_at'][:-1]) - datetime.fromisoformat(job['started_at'][:-1])).total_seconds()

    return github_metrics

def exponential_backoff_request(request_func, *args, max_retries, max_backoff=64):
    retries = 0
    while retries < max_retries:
        try:
            return request_func(*args)
        except Exception as e:
            wait_time = min((2 ** retries) + random.randint(0, 1000) / 1000.0, max_backoff)
            LOGGER.warning(f"Request failed with error: {e}. Retrying in {wait_time:.2f} seconds...")
            sleep(wait_time)
            retries += 1
    raise Exception("Max retries exceeded")

def append_row_with_backoff(worksheet, values, max_retries):
    exponential_backoff_request(worksheet.append_row, values, max_retries=max_retries)

def export_metrics(computed_metrics, google_sheet_id, max_retries):
    gc = gspread.service_account()
    sh = gc.open_by_key(google_sheet_id)

    # Export workflow metrics to raw_workflow_data worksheet
    raw_workflow_data = sh.worksheet("raw_workflow_data")
    workflow_headers = list(WORKFLOW_TEMPLATE.keys())

    for vendor, metrics in computed_metrics.items():
        workflow = metrics.get('workflow')
        values = [workflow.get(header) for header in workflow_headers]
        append_row_with_backoff(raw_workflow_data, values, max_retries=max_retries)

    LOGGER.info("Exported workflow metrics to raw_workflow_data worksheet")

    # Export job metrics to raw_job_data worksheet
    raw_job_data = sh.worksheet("raw_job_data")
    job_headers = list(JOB_TEMPLATE.keys())

    for vendor, metrics in computed_metrics.items():
        jobs = metrics.get('jobs')
        for job in jobs:
            values = [job.get(header) for header in job_headers]
            append_row_with_backoff(raw_job_data, values, max_retries=max_retries)

    LOGGER.info("Exported job metrics to raw_job_data worksheet")

def convert_epoch_to_timestamp(epoch_time):
    """
    Convert an epoch time (seconds since 01-01-1970) to a human-readable timestamp.

    :param epoch_time: int, epoch time in seconds
    :return: str, human-readable timestamp
    """
    return datetime.fromtimestamp(epoch_time / 1000, tz=timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

if __name__ == "__main__":
    main()
