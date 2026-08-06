import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = (scene as? UIWindowScene) else {
            NSLog("### SceneDelegate: not a UIWindowScene")
            return
        }
        NSLog("### SceneDelegate willConnectTo called")
        let storyboard = UIStoryboard(name: "Main", bundle: nil)
        let initialVC = storyboard.instantiateInitialViewController()
        if let vc = initialVC {
            NSLog("### SceneDelegate root class: %@", String(describing: type(of: vc)))
        } else {
            NSLog("### SceneDelegate: instantiateInitialViewController returned nil")
        }
        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = initialVC ?? UIViewController()
        window?.makeKeyAndVisible()
        let isKey = window?.isKeyWindow ?? false
        NSLog("### SceneDelegate isKey: %@", isKey ? "YES" : "NO")
        NSLog("### SceneDelegate root: %@", String(describing: window?.rootViewController))
    }

    func sceneDidDisconnect(_ scene: UIScene) {
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
    }

    func sceneWillResignActive(_ scene: UIScene) {
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
    }
}
