import os
import json
import time
import logging

try:
    import urllib.request as urllib2
except ImportError:
    import urllib2

log = logging.getLogger("travis.leader")
log.addHandler(logging.StreamHandler())
log.setLevel(logging.INFO)

TRAVIS_JOB_NUMBER = 'TRAVIS_JOB_NUMBER'
TRAVIS_BUILD_ID = 'TRAVIS_BUILD_ID'
POLLING_INTERVAL = 'LEADER_POLLING_INTERVAL'

build_id = os.getenv(TRAVIS_BUILD_ID)
polling_interval = int(os.getenv(POLLING_INTERVAL, '5'))

#assume, first job is the leader
is_leader = lambda job_number: job_number.endswith('.1')

if not os.getenv(TRAVIS_JOB_NUMBER):
    # seems even for builds with only one job, this won't get here
    log.fatal("Don't use defining leader for build without matrix")
    exit(1)
elif is_leader(os.getenv(TRAVIS_JOB_NUMBER)):
    log.info("This is a leader")
else:
    #since python is subprocess, env variables are exported back via file
    with open(".to_export_back", "w") as export_var:
        export_var.write("BUILD_MINION=YES")
    log.info("This is a minion")
    exit(0)


class MatrixElement(object):
    def __init__(self, json_raw):
        self.allow_failure = json_raw['allow_failure']
        self.is_finished = json_raw['finished_at'] is not None
        self.is_succeeded = json_raw['result'] == 0
        self.number = json_raw['number']
        self.is_leader = is_leader(self.number)


def matrix_snapshot():
    """
    :return: Matrix List
    """
    response = urllib2.build_opener().open("https://api.travis-ci.org/builds/{0}".format(build_id)).read()
    raw_json = json.loads(response)
    matrix_without_leader = [MatrixElement(element) for element in raw_json["matrix"]]
    return matrix_without_leader


def wait_others_to_finish():
    def others_finished():
        """
        Dumps others to finish
        Leader cannot finish, it is working now
        :return: tuple(True or False, List of not finished jobs)
        """
        snapshot = matrix_snapshot()
        finished = [el.is_finished for el in snapshot if not (el.is_leader or el.allow_failure)]
        return reduce(lambda a, b: a and b, finished), [el.number for el in snapshot if
                                                        not el.is_leader and not el.is_finished]

    while True:
        finished, waiting_list = others_finished()
        if finished: break
        log.info("Leader waits for minions {0}...".format(waiting_list))  # just in case do not get "silence timeout"
        time.sleep(polling_interval)


try:
    wait_others_to_finish()

    final_snapshot = matrix_snapshot()
    log.info("Final Results: {0}".format([(e.number, e.is_succeeded, e.allow_failure) for e in final_snapshot]))

    BUILD_AGGREGATE_STATUS = 'BUILD_AGGREGATE_STATUS'
    others_snapshot = [el for el in final_snapshot if not (el.is_leader or el.allow_failure)]
    if reduce(lambda a, b: a and b, [e.is_succeeded for e in others_snapshot]):
        os.environ[BUILD_AGGREGATE_STATUS] = "others_succeeded"
    elif reduce(lambda a, b: a and b, [not e.is_succeeded for e in others_snapshot]):
        log.error("Others Failed")
        os.environ[BUILD_AGGREGATE_STATUS] = "others_failed"
    else:
        log.warn("Others Unknown")
        os.environ[BUILD_AGGREGATE_STATUS] = "unknown"
    #since python is subprocess, env variables are exported back via file
    with open(".to_export_back", "w") as export_var:
        export_var.write("BUILD_LEADER=YES {0}={1}".format(BUILD_AGGREGATE_STATUS, os.environ[BUILD_AGGREGATE_STATUS]))

except Exception as e:
    log.fatal(e)
