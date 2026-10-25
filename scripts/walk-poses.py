"""The run cycle's poses: a plain person built in Blender, facing +X, rendered from straight above in 8 frames.

  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python scripts/walk-poses.py -- <out-dir>

Writes <out-dir>/pose-0..7.png and <out-dir>/pose.png, the guide sheet Codex paints each character over
(4 x 2 cells of 384 px, frames 1-4 on top, the hips at each cell's centre); process-sprites.py cuts the result.
Neutral colours, so the painted character keeps its own.
"""
import math
import sys
import bpy
import numpy as np

OUT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "."
FRAMES = 8
RES = 512
ORTHO = 1.7  # meters across a render
CELL, FIGURE = 384, 330  # guide cell, and the render scaled into it

jacket = sleeve = (0.55, 0.55, 0.58)
trousers = (0.14, 0.14, 0.16)
shoes = (0.05, 0.05, 0.05)
hair = (0.2, 0.11, 0.05)
skin = (0.92, 0.66, 0.5)

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
for m in list(bpy.data.materials):
    bpy.data.materials.remove(m)

scene = bpy.context.scene


def mat(rgb, rough=0.6):
    m = bpy.data.materials.new(f"m{len(bpy.data.materials)}")
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
    bsdf.inputs["Roughness"].default_value = rough
    return m


def joint(name, loc, parent=None):
    e = bpy.data.objects.new(name, None)
    scene.collection.objects.link(e)
    e.parent = parent
    e.location = loc
    e.rotation_mode = "XYZ"
    return e


def blob(loc, scale, material, parent, segs=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=segs // 2, location=(0, 0, 0))
    o = bpy.context.object
    o.scale = scale
    o.parent = parent
    o.location = loc
    o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return o


def limb(length, radius, material, parent, end_radius=None):
    """A tapered capsule hanging down -Z from its joint."""
    bpy.ops.mesh.primitive_cone_add(vertices=20, radius1=radius, radius2=end_radius or radius * 0.85, depth=length, location=(0, 0, 0))
    o = bpy.context.object
    o.parent = parent
    o.location = (0, 0, -length / 2)
    o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    blob((0, 0, -length), (radius, radius, radius), material, parent, 12)
    blob((0, 0, 0), (radius, radius, radius), material, parent, 12)
    return o


M = {k: mat(v) for k, v in dict(jacket=jacket, sleeve=sleeve, trousers=trousers, shoes=shoes, hair=hair, skin=skin).items()}
M["hair"] = mat(hair, 0.9)

root = joint("root", (0, 0, 0))
pelvis = joint("pelvis", (0, 0, 0.95), root)
blob((0, 0, 0.02), (0.15, 0.2, 0.12), M["trousers"], pelvis)
chest = joint("chest", (0, 0, 0.05), pelvis)
blob((0, 0, 0.32), (0.16, 0.25, 0.3), M["jacket"], chest)
# collar and shoulders: broad, so the top view reads like GTA 2's shoulders-and-head person
blob((0, 0.17, 0.47), (0.13, 0.11, 0.08), M["jacket"], chest)
blob((0, -0.17, 0.47), (0.13, 0.11, 0.08), M["jacket"], chest)
head = joint("head", (0.02, 0, 0.64), chest)
blob((0, 0, 0), (0.115, 0.1, 0.125), M["skin"], head)
blob((0.11, 0, -0.01), (0.035, 0.025, 0.03), M["skin"], head)  # nose
blob((0.0, 0.1, -0.01), (0.03, 0.02, 0.04), M["skin"], head)  # ears
blob((0.0, -0.1, -0.01), (0.03, 0.02, 0.04), M["skin"], head)
blob((-0.02, 0, 0.035), (0.122, 0.112, 0.11), M["hair"], head)

legs, arms = [], []
for side in (1, -1):
    hip = joint(f"hip{side}", (0, side * 0.1, 0), pelvis)
    limb(0.44, 0.075, M["trousers"], hip, 0.06)
    knee = joint(f"knee{side}", (0, 0, -0.44), hip)
    limb(0.42, 0.06, M["trousers"], knee, 0.05)
    ankle = joint(f"ankle{side}", (0, 0, -0.42), knee)
    blob((0.07, 0, -0.04), (0.14, 0.06, 0.05), M["shoes"], ankle)
    legs.append((hip, knee, ankle))
    sh = joint(f"shoulder{side}", (0, side * 0.27, 0.43), chest)
    limb(0.3, 0.062, M["sleeve"], sh, 0.055)
    elbow = joint(f"elbow{side}", (0, 0, -0.3), sh)
    limb(0.26, 0.052, M["sleeve"], elbow, 0.045)
    blob((0, 0, -0.3), (0.05, 0.045, 0.055), M["skin"], elbow)
    arms.append((sh, elbow))

# Camera straight down: image right = +X (the facing), image up = +Y.
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.data.type = "ORTHO"
cam.data.ortho_scale = ORTHO
cam.location = (0, 0, 6)
scene.collection.objects.link(cam)
scene.camera = cam

# Sun from the top-left of the image, high: the sprites' house light.
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
sun.data.energy = 4.5
sun.data.angle = math.radians(8)
sun.rotation_euler = (math.radians(35), math.radians(-25), math.radians(0))
scene.collection.objects.link(sun)
world = bpy.data.worlds.new("w")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.9
scene.world = world

r = scene.render
r.engine = "BLENDER_EEVEE"
r.resolution_x = r.resolution_y = RES
r.film_transparent = True
r.image_settings.file_format = "PNG"
r.image_settings.color_mode = "RGBA"
r.use_freestyle = True
r.line_thickness_mode = "ABSOLUTE"
r.line_thickness = 2.2
scene.view_settings.view_transform = "Standard"
fs = scene.view_layers[0].freestyle_settings
ls = fs.linesets[0] if len(fs.linesets) else fs.linesets.new("outline")
if ls.linestyle is None:
    ls.linestyle = bpy.data.linestyles.new("outline")
ls.linestyle.color = (0.08, 0.06, 0.05)
ls.select_by_visibility = True
ls.select_silhouette = True
ls.select_border = True
ls.select_crease = False

SWING = math.radians(30)
ARM = math.radians(32)
for f in range(FRAMES):
    p = f / FRAMES * 2 * math.pi
    # Lean into the run.
    chest.rotation_euler = (0, math.radians(10), math.sin(p) * math.radians(7))
    pelvis.location.z = 0.95 + abs(math.cos(p)) * 0.04
    for (hip, knee, ankle), side in zip(legs, (1, -1)):
        s = math.sin(p) * side
        # Rotating about +Y swings the foot towards -X; negate so s > 0 is the foot forward.
        hip.rotation_euler = (0, -s * SWING, 0)
        # The leg swinging forward folds at the knee (foot up under the hip); the planted one stays nearly straight.
        bend = max(0.0, math.cos(p) * side)
        knee.rotation_euler = (0, math.radians(12) + bend * math.radians(40), 0)
        ankle.rotation_euler = (0, -bend * math.radians(20), 0)
    for (sh, elbow), side in zip(arms, (1, -1)):
        s = -math.sin(p) * side
        sh.rotation_euler = (side * math.radians(-8), -s * ARM, 0)
        elbow.rotation_euler = (0, -math.radians(55), 0)
    r.filepath = f"{OUT}/pose-{f}.png"
    bpy.ops.render.render(write_still=True)


# The guide sheet: each render scaled to FIGURE px, centred in its cell on magenta.
sheet = np.zeros((2 * CELL, 4 * CELL, 4), np.float32)
sheet[...] = (1, 0, 1, 1)
for f in range(FRAMES):
    img = bpy.data.images.load(f"{OUT}/pose-{f}.png")
    img.scale(FIGURE, FIGURE)
    px = np.array(img.pixels[:], np.float32).reshape(FIGURE, FIGURE, 4)
    row, col = 1 - f // 4, f % 4  # Blender's pixel rows run bottom to top
    y0, x0 = row * CELL + (CELL - FIGURE) // 2, col * CELL + (CELL - FIGURE) // 2
    cell = sheet[y0 : y0 + FIGURE, x0 : x0 + FIGURE]
    a = px[..., 3:4]
    cell[..., :3] = px[..., :3] * a + cell[..., :3] * (1 - a)
out = bpy.data.images.new("pose", 4 * CELL, 2 * CELL, alpha=False)
out.pixels = sheet.ravel()
out.filepath_raw = f"{OUT}/pose.png"
out.file_format = "PNG"
out.save()
