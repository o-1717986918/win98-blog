#include "solver_engine.h"

#include <stdint.h>
#include <string.h>

#define WEB_INPUT_CAP 4096

static char web_input[WEB_INPUT_CAP];
static char web_rows[SOLVER_MAP_MAX_H][SOLVER_MAP_MAX_W + 1];
static const char *web_row_ptrs[SOLVER_MAP_MAX_H];
static char web_end_map[SOLVER_MAP_MAX_H][SOLVER_MAP_MAX_W + 1];
static const char *web_end_ptrs[SOLVER_MAP_MAX_H];
static SolverResult web_recognition;
static SolverResult web_planning;
static int web_error;

static int web_allowed_cell(char value) {
    return value == '#' || value == '-' || value == '@' || value == '$' ||
           value == '.' || value == '*' || value == '+';
}

static int web_parse_input(SolverInput *out) {
    int width = -1;
    int height = 0;
    const char *cursor = web_input;

    while (*cursor != '\0') {
        if (height >= SOLVER_MAP_MAX_H) return 2;
        int line_width = 0;
        while (*cursor != '\0' && *cursor != '\n' && *cursor != '\r') {
            if (line_width >= SOLVER_MAP_MAX_W || !web_allowed_cell(*cursor)) return 3;
            web_rows[height][line_width++] = *cursor++;
        }
        while (*cursor == '\n' || *cursor == '\r') cursor++;
        if (line_width == 0) continue;
        if (width < 0) width = line_width;
        if (line_width != width) return 4;
        web_rows[height][line_width] = '\0';
        web_row_ptrs[height] = web_rows[height];
        height++;
    }

    if (width < 3 || height < 3) return 5;
    out->w = width;
    out->h = height;
    for (int row = 0; row < height; row++) out->rows[row] = web_row_ptrs[row];
    return 0;
}

char *solver_web_input(void) { return web_input; }
int solver_web_input_capacity(void) { return WEB_INPUT_CAP; }

int solver_web_run(int include_planning) {
    SolverInput input;
    memset(&input, 0, sizeof(input));
    memset(&web_recognition, 0, sizeof(web_recognition));
    memset(&web_planning, 0, sizeof(web_planning));
    web_error = web_parse_input(&input);
    if (web_error != 0) return -web_error;

    solver_recognition_into(&input, &web_recognition);
    if (!include_planning) return web_recognition.solved ? 1 : 0;
    if (!web_recognition.solved || web_recognition.end_map_w <= 0 || web_recognition.end_map_h <= 0) {
        web_error = 6;
        return -web_error;
    }

    SolverInput planning_input;
    memset(&planning_input, 0, sizeof(planning_input));
    planning_input.w = web_recognition.end_map_w;
    planning_input.h = web_recognition.end_map_h;
    for (int row = 0; row < planning_input.h; row++) {
        memcpy(web_end_map[row], web_recognition.end_map[row], (size_t)planning_input.w);
        web_end_map[row][planning_input.w] = '\0';
        web_end_ptrs[row] = web_end_map[row];
        planning_input.rows[row] = web_end_ptrs[row];
    }

    solver_planning_into(&planning_input, NULL, &web_recognition.start_pos, &web_planning);
    return web_planning.solved ? 2 : 1;
}

int solver_web_error(void) { return web_error; }
int solver_web_recognition_solved(void) { return web_recognition.solved ? 1 : 0; }
int solver_web_planning_solved(void) { return web_planning.solved ? 1 : 0; }
int solver_web_recognition_length(void) { return web_recognition.recog_path_len; }
int solver_web_planning_length(void) { return web_planning.solve_path_len; }
int solver_web_recognition_turns(void) {
    return solver_path_count_turns(web_recognition.recog_path, web_recognition.recog_path_len);
}
int solver_web_planning_turns(void) {
    return solver_path_count_turns(web_planning.solve_path, web_planning.solve_path_len);
}
int solver_web_boxes_total(void) { return web_planning.boxes_total ? web_planning.boxes_total : web_recognition.boxes_total; }
int solver_web_boxes_completed(void) { return web_planning.boxes_completed; }
int solver_web_bombs_total(void) { return web_planning.bombs_total ? web_planning.bombs_total : web_recognition.bombs_total; }
int solver_web_bombs_detonated(void) { return web_planning.bombs_detonated; }
int solver_web_fail_reason(void) {
    return web_planning.fail_reason != SOLVE_FAIL_NONE ? web_planning.fail_reason : web_recognition.fail_reason;
}
float solver_web_elapsed_ms(void) { return web_recognition.solve_time_ms + web_planning.solve_time_ms; }
const char *solver_web_recognition_path(void) { return web_recognition.recog_path; }
const char *solver_web_planning_path(void) { return web_planning.solve_path; }
const char *solver_web_end_map_row(int row) {
    if (row < 0 || row >= web_recognition.end_map_h) return "";
    return web_recognition.end_map[row];
}
int solver_web_end_map_width(void) { return web_recognition.end_map_w; }
int solver_web_end_map_height(void) { return web_recognition.end_map_h; }
